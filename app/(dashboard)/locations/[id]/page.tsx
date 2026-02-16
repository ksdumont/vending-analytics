'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { PAYMENT_CATEGORIES, type PaymentCategory } from '@/lib/utils/constants'
import { ArrowLeft, Monitor } from 'lucide-react'
import type { Location, Machine, Region } from '@/lib/types/database'

export default function LocationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [location, setLocation] = useState<Location | null>(null)
  const [region, setRegion] = useState<Region | null>(null)
  const [machines, setMachines] = useState<(Machine & { revenue: number; vends: number })[]>([])
  const [paymentBreakdown, setPaymentBreakdown] = useState<{ category: string; revenue: number; count: number }[]>([])
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalVends, setTotalVends] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !params.id) return

    const fetchData = async () => {
      const supabase = createClient()
      const locationId = params.id as string

      const [locRes, salesRes, machinesRes] = await Promise.all([
        supabase.from('locations').select('*').eq('id', locationId).single(),
        supabase.from('sales_data').select('*').eq('location_id', locationId).eq('user_id', user.id),
        supabase.from('machines').select('*').eq('location_id', locationId).eq('user_id', user.id),
      ])

      const loc = locRes.data
      const sales = salesRes.data || []
      const machs = machinesRes.data || []

      if (loc?.region_id) {
        const { data: reg } = await supabase.from('regions').select('*').eq('id', loc.region_id).single()
        setRegion(reg)
      }

      // Machine stats
      const machineStats = new Map<string, { revenue: number; vends: number }>()
      sales.forEach(s => {
        if (!s.machine_id) return
        const existing = machineStats.get(s.machine_id) || { revenue: 0, vends: 0 }
        existing.revenue += Number(s.amount)
        existing.vends += s.vend_count
        machineStats.set(s.machine_id, existing)
      })

      const machinesWithStats = machs.map(m => ({
        ...m,
        revenue: machineStats.get(m.id)?.revenue || 0,
        vends: machineStats.get(m.id)?.vends || 0,
      })).sort((a, b) => b.revenue - a.revenue)

      // Payment breakdown
      const paymentMap = new Map<string, { revenue: number; count: number }>()
      sales.forEach(s => {
        const cat = s.payment_category || 'other'
        const existing = paymentMap.get(cat) || { revenue: 0, count: 0 }
        existing.revenue += Number(s.amount)
        existing.count += s.tran_count
        paymentMap.set(cat, existing)
      })

      setLocation(loc)
      setMachines(machinesWithStats)
      setPaymentBreakdown(
        Array.from(paymentMap.entries())
          .map(([category, data]) => ({ category, ...data }))
          .sort((a, b) => b.revenue - a.revenue)
      )
      setTotalRevenue(sales.reduce((sum, s) => sum + Number(s.amount), 0))
      setTotalVends(sales.reduce((sum, s) => sum + s.vend_count, 0))
      setLoading(false)
    }

    fetchData()
  }, [user, params.id])

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (!location) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Location not found</p>
        <Link href="/locations"><Button variant="outline" className="mt-4">Back to Locations</Button></Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/locations')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {region && <span>{region.name}</span>}
            {location.location_type && location.location_type !== '- Not Assigned -' && (
              <Badge variant="default">{location.location_type}</Badge>
            )}
            {location.city && <span>{location.city}, {location.state}</span>}
          </div>
        </div>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="sm">
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500">Vends</p>
          <p className="text-xl font-bold text-gray-900">{formatNumber(totalVends)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500">Machines</p>
          <p className="text-xl font-bold text-gray-900">{formatNumber(machines.length)}</p>
        </Card>
      </div>

      {/* Machines at this location */}
      <Card padding="none">
        <CardHeader className="px-6 pt-6">
          <CardTitle>Machines</CardTitle>
        </CardHeader>
        {machines.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-gray-500">No machines at this location</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {machines.map(m => (
              <Link key={m.id} href={`/machines/${m.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <Monitor className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 font-mono">{m.serial_number}</p>
                    <p className="text-xs text-gray-500">{[m.make, m.model].filter(Boolean).join(' ') || 'Unknown'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatCurrency(m.revenue)}</p>
                  <p className="text-xs text-gray-500">{formatNumber(m.vends)} vends</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Payment breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Breakdown</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {paymentBreakdown.map(p => (
            <div key={p.category} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {PAYMENT_CATEGORIES[p.category as PaymentCategory] || p.category}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-gray-500">{formatNumber(p.count)} txns</span>
                <span className="font-medium w-24 text-right">{formatCurrency(p.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
