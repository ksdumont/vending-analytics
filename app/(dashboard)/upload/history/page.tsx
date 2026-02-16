'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { ArrowLeft, Upload } from 'lucide-react'
import { formatNumber, formatDateRange } from '@/lib/utils/format'
import type { CsvUpload } from '@/lib/types/database'

export default function UploadHistoryPage() {
  const { user } = useAuth()
  const [uploads, setUploads] = useState<CsvUpload[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchUploads = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('csv_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setUploads(data || [])
      setLoading(false)
    }

    fetchUploads()
  }, [user])

  const statusVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'failed': return 'danger'
      case 'processing': return 'warning'
      default: return 'default'
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/upload">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Upload History</h1>
        </div>
        <Link href="/upload">
          <Button size="sm">
            <Upload className="w-4 h-4 mr-1" />
            New Upload
          </Button>
        </Link>
      </div>

      {loading ? (
        <TableSkeleton rows={5} />
      ) : uploads.length === 0 ? (
        <Card>
          <EmptyState
            icon={Upload}
            title="No uploads yet"
            description="Upload your first CSV file to get started with analytics."
            actionLabel="Upload CSV"
            actionHref="/upload"
          />
        </Card>
      ) : (
        <Card padding="none">
          <div className="divide-y divide-gray-100">
            {uploads.map((upload) => (
              <div key={upload.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-gray-900 text-sm">{upload.filename}</p>
                  <Badge variant={statusVariant(upload.status)}>
                    {upload.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{upload.platform}</span>
                  {upload.period_start && upload.period_end && (
                    <span>{formatDateRange(upload.period_start, upload.period_end)}</span>
                  )}
                  <span>{formatNumber(upload.imported_rows)} imported</span>
                  {upload.duplicate_rows > 0 && (
                    <span>{formatNumber(upload.duplicate_rows)} duplicates</span>
                  )}
                  <span>{new Date(upload.created_at).toLocaleDateString()}</span>
                </div>
                {upload.error_message && (
                  <p className="text-xs text-red-500 mt-1">{upload.error_message}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
