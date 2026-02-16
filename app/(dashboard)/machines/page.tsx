'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { Monitor, Search, AlertTriangle } from 'lucide-react'
import type { Machine } from '@/lib/types/database'

interface MachineWithStats extends Machine {
  revenue: number
  vendCount: number
  locationName: string
  [key: string]: unknown
}

export default function MachinesPage() {
  const { user } = useAuth()
  const [machines, setMachines] = useState<MachineWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const supabase = createClient()

      const [machinesRes, salesRes, locationsRes] = await Promise.all([
        supabase.from('machines').select('*').eq('user_id', user.id),
        supabase.from('sales_data').select('machine_id, amount, vend_count').eq('user_id', user.id),
        supabase.from('locations').select('id, name').eq('user_id', user.id),
      ])

      const machinesList = machinesRes.data || []
      const sales = salesRes.data || []
      const locations = locationsRes.data || []

      const locationMap = new Map(locations.map(l => [l.id, l.name]))

      const machineStats = new Map<string, { revenue: number; vendCount: number }>()
      sales.forEach(s => {
        if (!s.machine_id) return
        const existing = machineStats.get(s.machine_id) || { revenue: 0, vendCount: 0 }
        existing.revenue += Number(s.amount)
        existing.vendCount += s.vend_count
        machineStats.set(s.machine_id, existing)
      })

      const withStats: MachineWithStats[] = machinesList.map(m => ({
        ...m,
        revenue: machineStats.get(m.id)?.revenue || 0,
        vendCount: machineStats.get(m.id)?.vendCount || 0,
        locationName: m.location_id ? locationMap.get(m.location_id) || 'Unknown' : 'No Location',
      })).sort((a, b) => b.revenue - a.revenue)

      setMachines(withStats)
      setLoading(false)
    }

    fetchData()
  }, [user])

  const filtered = useMemo(() => {
    if (!search) return machines
    const q = search.toLowerCase()
    return machines.filter(m =>
      m.serial_number.toLowerCase().includes(q) ||
      m.make?.toLowerCase().includes(q) ||
      m.model?.toLowerCase().includes(q) ||
      m.locationName.toLowerCase().includes(q) ||
      m.product_type?.toLowerCase().includes(q)
    )
  }, [machines, search])

  const zeroRevenueCount = machines.filter(m => m.revenue === 0).length

  const columns: Column<MachineWithStats>[] = [
    {
      key: 'serial_number',
      header: 'Serial #',
      render: (item) => <span className="font-mono text-sm">{item.serial_number}</span>,
    },
    {
      key: 'make',
      header: 'Make/Model',
      render: (item) => {
        const parts = [item.make, item.model].filter(Boolean)
        return parts.length > 0 ? <span>{parts.join(' ')}</span> : <span className="text-gray-400">-</span>
      },
      hideOnMobile: true,
    },
    {
      key: 'locationName',
      header: 'Location',
      hideOnMobile: true,
    },
    {
      key: 'product_type',
      header: 'Product',
      render: (item) => item.product_type ? <Badge>{item.product_type}</Badge> : <span className="text-gray-400">-</span>,
      hideOnMobile: true,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      render: (item) => (
        <span className={`font-medium ${item.revenue === 0 ? 'text-red-500' : 'text-gray-900'}`}>
          {formatCurrency(item.revenue)}
        </span>
      ),
    },
    {
      key: 'vendCount',
      header: 'Vends',
      render: (item) => formatNumber(item.vendCount),
    },
  ]

  if (loading) {
    return (
      <div>
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        <TableSkeleton rows={8} />
      </div>
    )
  }

  if (machines.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Machines</h1>
        <Card>
          <EmptyState
            icon={Monitor}
            title="No Machines Yet"
            description="Upload a CSV file to automatically create machines from your sales data."
            actionLabel="Upload CSV"
            actionHref="/upload"
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Machines</h1>
          <p className="text-sm text-gray-500">{machines.length} machines total</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search machines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {zeroRevenueCount > 0 && (
        <Card padding="sm" className="border-yellow-200 bg-yellow-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-800">
              <strong>{zeroRevenueCount}</strong> machine{zeroRevenueCount !== 1 ? 's' : ''} with zero revenue in this period
            </p>
          </div>
        </Card>
      )}

      <Card padding="none">
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(item) => item.id}
          onRowClick={(item) => window.location.href = `/machines/${item.id}`}
        />
      </Card>
    </div>
  )
}
