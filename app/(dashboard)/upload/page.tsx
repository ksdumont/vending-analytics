'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUpload } from '@/lib/hooks/useUpload'
import { CSVUpload } from '@/components/upload/CSVUpload'
import { PlatformSelector } from '@/components/upload/PlatformSelector'
import { UploadPreview } from '@/components/upload/UploadPreview'
import { ImportProgress } from '@/components/upload/ImportProgress'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Clock, FileText } from 'lucide-react'
import { PLATFORMS } from '@/lib/utils/constants'

export default function UploadPage() {
  const router = useRouter()
  const upload = useUpload()

  // Show import progress/results when importing or complete
  if (upload.stage === 'importing' || upload.stage === 'complete' || (upload.stage === 'error' && upload.importResult)) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload CSV</h1>
        <ImportProgress
          progress={upload.importProgress}
          result={upload.importResult}
          stage={upload.stage === 'error' ? 'error' : upload.stage as 'importing' | 'complete'}
          error={upload.error}
          onReset={upload.reset}
          onGoToDashboard={() => router.push('/dashboard')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Upload CSV</h1>
        <Link href="/upload/history">
          <Button variant="ghost" size="sm">
            <Clock className="w-4 h-4 mr-1" />
            Upload History
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Step 1: File Upload */}
        <Card>
          <CardHeader>
            <CardTitle>1. Select File</CardTitle>
            <CardDescription>Upload a sales rollup CSV from your payment processor</CardDescription>
          </CardHeader>
          <CSVUpload
            onFileSelect={upload.handleFile}
            file={upload.file}
            onClear={upload.reset}
            disabled={upload.stage === 'parsing'}
          />
        </Card>

        {/* Steps 2-4 show after file is parsed */}
        {upload.parseResult && (
          <>
            {/* Step 2: Platform */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>2. Platform</CardTitle>
                  {upload.platform && (
                    <Badge variant="success">
                      Auto-detected: {PLATFORMS[upload.platform]}
                    </Badge>
                  )}
                </div>
                <CardDescription>Confirm or change the detected platform</CardDescription>
              </CardHeader>
              <PlatformSelector
                value={upload.platform}
                onChange={upload.setPlatform}
              />
            </Card>

            {/* Step 3: Date Range */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>3. Date Range</CardTitle>
                  {upload.dateRange && (
                    <Badge variant="success">Auto-detected from filename</Badge>
                  )}
                </div>
                <CardDescription>The reporting period for this CSV data</CardDescription>
              </CardHeader>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="date"
                  label="Period Start"
                  value={upload.dateRange?.startDate || ''}
                  onChange={(e) => upload.setDateRange({
                    startDate: e.target.value,
                    endDate: upload.dateRange?.endDate || e.target.value,
                  })}
                />
                <Input
                  type="date"
                  label="Period End"
                  value={upload.dateRange?.endDate || ''}
                  onChange={(e) => upload.setDateRange({
                    startDate: upload.dateRange?.startDate || e.target.value,
                    endDate: e.target.value,
                  })}
                />
              </div>
            </Card>

            {/* Step 4: Preview */}
            <Card>
              <CardHeader>
                <CardTitle>4. Data Preview</CardTitle>
                <CardDescription>
                  {upload.parseResult.rows.length} rows detected with{' '}
                  {Object.values(upload.parseResult.mapping).filter(Boolean).length} mapped columns
                </CardDescription>
              </CardHeader>
              <UploadPreview rows={upload.parseResult.rows} />
            </Card>

            {/* Import Button */}
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={upload.reset}>Cancel</Button>
              <Button
                onClick={upload.startImport}
                disabled={!upload.dateRange?.startDate || !upload.dateRange?.endDate}
                size="lg"
              >
                <FileText className="w-4 h-4 mr-2" />
                Import {upload.parseResult.rows.length} Rows
              </Button>
            </div>
          </>
        )}

        {/* Error state */}
        {upload.stage === 'error' && !upload.importResult && (
          <Card>
            <div className="text-center py-4">
              <p className="text-red-600 mb-3">{upload.error}</p>
              <Button onClick={upload.reset} variant="outline">Try Again</Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
