'use client'

import { ParsedSalesRow } from '@/lib/services/csv-parser'
import { formatCurrency } from '@/lib/utils/format'
import { Badge } from '@/components/ui/Badge'

interface UploadPreviewProps {
  rows: ParsedSalesRow[]
  maxRows?: number
}

export function UploadPreview({ rows, maxRows = 5 }: UploadPreviewProps) {
  const preview = rows.slice(0, maxRows)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Data Preview</h3>
        <span className="text-sm text-gray-500">{rows.length} total rows</span>
      </div>
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-500">Region</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500">Location</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500">Serial #</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500">Product</th>
              <th className="text-left py-2 px-3 font-medium text-gray-500">Payment</th>
              <th className="text-right py-2 px-3 font-medium text-gray-500">Trans</th>
              <th className="text-right py-2 px-3 font-medium text-gray-500">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {preview.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="py-2 px-3 text-gray-700">{row.region}</td>
                <td className="py-2 px-3 text-gray-700 max-w-[200px] truncate">{row.location}</td>
                <td className="py-2 px-3 text-gray-500 font-mono">{row.serialNumber}</td>
                <td className="py-2 px-3">
                  <Badge variant="default">{row.productType || 'N/A'}</Badge>
                </td>
                <td className="py-2 px-3">
                  <Badge variant="info">{row.paymentCategory}</Badge>
                </td>
                <td className="py-2 px-3 text-right text-gray-700">{row.tranCount}</td>
                <td className="py-2 px-3 text-right font-medium text-gray-900">{formatCurrency(row.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > maxRows && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Showing {maxRows} of {rows.length} rows
        </p>
      )}
    </div>
  )
}
