'use client'

import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'

export interface Column<T> {
  key: string
  header: string
  render?: (item: T, index: number) => React.ReactNode
  sortable?: boolean
  className?: string
  hideOnMobile?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (item: T) => string
  onRowClick?: (item: T) => void
  emptyMessage?: string
}

type SortDirection = 'asc' | 'desc' | null

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc')
      if (sortDir === 'desc') setSortKey(null)
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }

      const aStr = String(aVal)
      const bStr = String(bVal)
      return sortDir === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr)
    })
  }, [data, sortKey, sortDir])

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {columns.map(col => (
              <th
                key={col.key}
                className={`text-left py-3 px-4 font-medium text-gray-500 ${col.sortable !== false ? 'cursor-pointer select-none hover:text-gray-700' : ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${col.className || ''}`}
                onClick={() => col.sortable !== false && handleSort(col.key)}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable !== false && (
                    <span className="text-gray-300">
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedData.map((item, index) => (
            <tr
              key={keyExtractor(item)}
              className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map(col => (
                <td key={col.key} className={`py-3 px-4 ${col.hideOnMobile ? 'hidden md:table-cell' : ''} ${col.className || ''}`}>
                  {col.render ? col.render(item, index) : String(item[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
