'use client'

import { useCallback } from 'react'
import { Upload, FileText, X } from 'lucide-react'

interface CSVUploadProps {
  onFileSelect: (file: File) => void
  file: File | null
  onClear: () => void
  disabled?: boolean
}

export function CSVUpload({ onFileSelect, file, onClear, disabled }: CSVUploadProps) {
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      onFileSelect(droppedFile)
    }
  }, [onFileSelect])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      onFileSelect(selectedFile)
    }
  }, [onFileSelect])

  if (file) {
    return (
      <div className="border-2 border-blue-200 bg-blue-50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-white"
            disabled={disabled}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <label
      htmlFor="csv-upload"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-colors cursor-pointer"
    >
      <input
        type="file"
        accept=".csv"
        onChange={handleChange}
        className="hidden"
        id="csv-upload"
        disabled={disabled}
      />
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <Upload className="w-6 h-6 text-gray-400" />
      </div>
      <p className="font-medium text-gray-700 mb-1">Drop your CSV file here or click to browse</p>
      <p className="text-sm text-gray-500">Supports Cantaloupe, Nayax, PayRange, and custom CSV formats</p>
    </label>
  )
}
