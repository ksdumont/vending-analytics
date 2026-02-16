'use client'

import { useState, useCallback } from 'react'
import { parseCSV, extractDateRangeFromFilename, type ParseResult, type CsvColumnMapping } from '@/lib/services/csv-parser'
import { importSalesData, type ImportResult, type ImportProgress } from '@/lib/services/import-service'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import type { Platform } from '@/lib/utils/constants'

export type UploadStage = 'idle' | 'parsing' | 'preview' | 'importing' | 'complete' | 'error'

export interface UploadState {
  stage: UploadStage
  file: File | null
  platform: Platform | null
  parseResult: ParseResult | null
  dateRange: { startDate: string; endDate: string } | null
  importProgress: ImportProgress | null
  importResult: ImportResult | null
  error: string | null
}

const initialState: UploadState = {
  stage: 'idle',
  file: null,
  platform: null,
  parseResult: null,
  dateRange: null,
  importProgress: null,
  importResult: null,
  error: null,
}

export function useUpload() {
  const [state, setState] = useState<UploadState>(initialState)
  const { user } = useAuth()

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const handleFile = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, stage: 'parsing', file, error: null }))

    try {
      const content = await file.text()
      const result = await parseCSV(content)
      const dateRange = extractDateRangeFromFilename(file.name)

      setState(prev => ({
        ...prev,
        stage: 'preview',
        parseResult: result,
        platform: result.platform,
        dateRange,
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        stage: 'error',
        error: err instanceof Error ? err.message : 'Failed to parse CSV file',
      }))
    }
  }, [])

  const setPlatform = useCallback((platform: Platform) => {
    setState(prev => ({ ...prev, platform }))
  }, [])

  const setDateRange = useCallback((dateRange: { startDate: string; endDate: string }) => {
    setState(prev => ({ ...prev, dateRange }))
  }, [])

  const setMapping = useCallback(async (mapping: CsvColumnMapping) => {
    if (!state.file) return

    setState(prev => ({ ...prev, stage: 'parsing' }))

    try {
      const content = await state.file.text()
      const result = await parseCSV(content, mapping)

      setState(prev => ({
        ...prev,
        stage: 'preview',
        parseResult: result,
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        stage: 'error',
        error: err instanceof Error ? err.message : 'Failed to re-parse with new mapping',
      }))
    }
  }, [state.file])

  const startImport = useCallback(async () => {
    if (!state.parseResult || !state.dateRange || !user) {
      setState(prev => ({ ...prev, stage: 'error', error: 'Missing required data for import' }))
      return
    }

    setState(prev => ({ ...prev, stage: 'importing', error: null }))

    const supabase = createClient()

    try {
      // Create csv_upload record
      const { data: upload, error: uploadError } = await supabase
        .from('csv_uploads')
        .insert({
          user_id: user.id,
          filename: state.file?.name || 'unknown.csv',
          platform: state.platform || 'custom',
          period_start: state.dateRange.startDate,
          period_end: state.dateRange.endDate,
          status: 'processing' as const,
          total_rows: state.parseResult.rows.length,
          imported_rows: 0,
          duplicate_rows: 0,
          error_message: null,
          mapping_id: null,
          completed_at: null,
        })
        .select('id')
        .single()

      if (uploadError || !upload) {
        throw new Error(`Failed to create upload record: ${uploadError?.message}`)
      }

      const result = await importSalesData(
        supabase,
        user.id,
        state.parseResult.rows,
        upload.id,
        state.dateRange.startDate,
        state.dateRange.endDate,
        (progress) => {
          setState(prev => ({ ...prev, importProgress: progress }))
        }
      )

      // Update csv_upload with results
      await supabase
        .from('csv_uploads')
        .update({
          status: result.errors.length > 0 ? 'failed' as const : 'completed' as const,
          imported_rows: result.importedRows,
          duplicate_rows: result.duplicateRows,
          error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
          completed_at: new Date().toISOString(),
        })
        .eq('id', upload.id)

      // Mark onboarding as completed if this is the first upload
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id)

      setState(prev => ({
        ...prev,
        stage: 'complete',
        importResult: result,
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        stage: 'error',
        error: err instanceof Error ? err.message : 'Import failed',
      }))
    }
  }, [state.parseResult, state.dateRange, state.platform, state.file, user])

  return {
    ...state,
    reset,
    handleFile,
    setPlatform,
    setDateRange,
    setMapping,
    startImport,
  }
}
