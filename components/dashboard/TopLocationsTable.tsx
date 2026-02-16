'use client'

import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import type { TopLocation } from '@/lib/services/analytics-service'

interface TopLocationsTableProps {
  data: TopLocation[]
}

export function TopLocationsTable({ data }: TopLocationsTableProps) {
  const router = useRouter()

  const columns: Column<TopLocation & Record<string, unknown>>[] = [
    {
      key: 'rank',
      header: '#',
      sortable: false,
      render: (_, i) => <span className="text-gray-400">{i + 1}</span>,
      className: 'w-10',
      hideOnMobile: true,
    },
    {
      key: 'name',
      header: 'Location',
      render: (item) => (
        <div>
          <p className="font-medium text-gray-900">{item.name as string}</p>
          {item.region && <p className="text-xs text-gray-500">{item.region as string}</p>}
        </div>
      ),
    },
    {
      key: 'locationType',
      header: 'Type',
      render: (item) => item.locationType ? <Badge>{item.locationType as string}</Badge> : <span className="text-gray-400">-</span>,
      hideOnMobile: true,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      render: (item) => <span className="font-medium">{formatCurrency(item.revenue as number)}</span>,
    },
    {
      key: 'vends',
      header: 'Vends',
      render: (item) => formatNumber(item.vends as number),
    },
    {
      key: 'avgPerVend',
      header: 'Avg/Vend',
      render: (item) => formatCurrency(item.avgPerVend as number),
      hideOnMobile: true,
    },
    {
      key: 'machineCount',
      header: 'Machines',
      render: (item) => formatNumber(item.machineCount as number),
      hideOnMobile: true,
    },
  ]

  // We need to cast to work with the generic DataTable
  const tableData = data.map((d, i) => ({ ...d, rank: i + 1 })) as unknown as (TopLocation & Record<string, unknown>)[]

  return (
    <Card padding="none">
      <CardHeader className="px-6 pt-6">
        <CardTitle>Top Locations</CardTitle>
      </CardHeader>
      <DataTable
        data={tableData}
        columns={columns}
        keyExtractor={(item) => item.id as string}
        onRowClick={(item) => router.push(`/locations/${item.id}`)}
      />
    </Card>
  )
}
