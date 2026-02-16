'use client'

import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import type { TopMachine } from '@/lib/services/analytics-service'

interface TopMachinesTableProps {
  data: TopMachine[]
}

export function TopMachinesTable({ data }: TopMachinesTableProps) {
  const router = useRouter()

  const columns: Column<TopMachine & Record<string, unknown>>[] = [
    {
      key: 'rank',
      header: '#',
      sortable: false,
      render: (_, i) => <span className="text-gray-400">{i + 1}</span>,
      className: 'w-10',
      hideOnMobile: true,
    },
    {
      key: 'serialNumber',
      header: 'Serial #',
      render: (item) => <span className="font-mono text-sm">{item.serialNumber as string}</span>,
    },
    {
      key: 'make',
      header: 'Make/Model',
      render: (item) => {
        const make = item.make as string
        const model = item.model as string
        if (!make && !model) return <span className="text-gray-400">-</span>
        return <span>{[make, model].filter(Boolean).join(' ')}</span>
      },
      hideOnMobile: true,
    },
    {
      key: 'location',
      header: 'Location',
      render: (item) => <span className="text-gray-700">{item.location as string}</span>,
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
  ]

  const tableData = data.map((d, i) => ({ ...d, rank: i + 1 })) as unknown as (TopMachine & Record<string, unknown>)[]

  return (
    <Card padding="none">
      <CardHeader className="px-6 pt-6">
        <CardTitle>Top Machines</CardTitle>
      </CardHeader>
      <DataTable
        data={tableData}
        columns={columns}
        keyExtractor={(item) => item.id as string}
        onRowClick={(item) => router.push(`/machines/${item.id}`)}
      />
    </Card>
  )
}
