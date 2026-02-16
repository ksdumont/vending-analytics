'use client'

import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { ImportProgress as ImportProgressType } from '@/lib/services/import-service'
import type { ImportResult } from '@/lib/services/import-service'
import { formatNumber } from '@/lib/utils/format'

interface ImportProgressProps {
  progress: ImportProgressType | null
  result: ImportResult | null
  stage: 'importing' | 'complete' | 'error'
  error: string | null
  onReset: () => void
  onGoToDashboard: () => void
}

const stageLabels = {
  regions: 'Creating regions',
  locations: 'Creating locations',
  machines: 'Creating machines',
  sales_data: 'Importing sales data',
}

export function ImportProgress({ progress, result, stage, error, onReset, onGoToDashboard }: ImportProgressProps) {
  if (stage === 'importing' && progress) {
    const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0

    return (
      <Card>
        <div className="text-center py-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Importing Data</h3>
          <p className="text-sm text-gray-500 mb-4">{progress.message}</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">{stageLabels[progress.stage]}</p>
        </div>
      </Card>
    )
  }

  if (stage === 'error') {
    return (
      <Card>
        <div className="text-center py-4">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Import Failed</h3>
          <p className="text-sm text-red-600 mb-4">{error}</p>
          <Button onClick={onReset} variant="outline">Try Again</Button>
        </div>
      </Card>
    )
  }

  if (stage === 'complete' && result) {
    const hasErrors = result.errors.length > 0

    return (
      <Card>
        <div className="text-center py-4">
          <CheckCircle className={`w-8 h-8 mx-auto mb-4 ${hasErrors ? 'text-yellow-500' : 'text-green-500'}`} />
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {hasErrors ? 'Import Completed with Warnings' : 'Import Complete'}
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-green-700">{formatNumber(result.importedRows)}</p>
              <p className="text-xs text-green-600">Imported</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-yellow-700">{formatNumber(result.duplicateRows)}</p>
              <p className="text-xs text-yellow-600">Duplicates</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-blue-700">{formatNumber(result.regionsCreated)}</p>
              <p className="text-xs text-blue-600">Regions</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-purple-700">{formatNumber(result.machinesCreated)}</p>
              <p className="text-xs text-purple-600">Machines</p>
            </div>
          </div>

          {hasErrors && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-left">
              <p className="text-sm font-medium text-yellow-800 mb-1">Warnings:</p>
              {result.errors.map((err, i) => (
                <p key={i} className="text-xs text-yellow-700">{err}</p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <Button onClick={onGoToDashboard}>View Dashboard</Button>
            <Button onClick={onReset} variant="outline">Upload Another</Button>
          </div>
        </div>
      </Card>
    )
  }

  return null
}
