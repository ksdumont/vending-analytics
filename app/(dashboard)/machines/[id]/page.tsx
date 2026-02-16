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
import { ArrowLeft } from 'lucide-react'
import type { Machine, Location, SalesData } from '@/lib/types/database'

export default function MachineDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [sales, setSales] = useState<SalesData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !params.id) return

    const fetchData = async () => {
      const supabase = createClient()
      const machineId = params.id as string

      const [machRes, salesRes] = await Promise.all([
        supabase.from('machines').select('*').eq('id', machineId).single(),
        supabase.from('sales_data').select('*').eq('machine_id', machineId).eq('user_id', user.id),
      ])

      const mach = machRes.data
      if (mach?.location_id) {
        const { data: loc } = await supabase.from('locations').select('*').eq('id', mach.location_id).single()
        setLocation(loc)
      }

      setMachine(mach)
      setSales(salesRes.data || [])
      setLoading(false)
    }

    fetchData()
  }, [user, params.id])

  if (loading) {
    return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>
  }

  if (!machine) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Machine not found</p>
        <Link href="/machines"><Button variant="outline" className="mt-4">Back to Machines</Button></Link>
      </div>
    )
  }

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.amount), 0)
  const totalVends = sales.reduce((sum, s) => sum + s.vend_count, 0)

  // Payment breakdown
  const paymentMap = new Map<string, { revenue: number; count: number }>()
  sales.forEach(s => {
    const cat = s.payment_category || 'other'
    const existing = paymentMap.get(cat) || { revenue: 0, count: 0 }
    existing.revenue += Number(s.amount)
    existing.count += s.tran_count
    paymentMap.set(cat, existing)
  })
  const paymentBreakdown = Array.from(paymentMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Product type breakdown
  const productMap = new Map<string, { revenue: number; vends: number }>()
  sales.forEach(s => {
    const pt = s.product_type || 'Other'
    const existing = productMap.get(pt) || { revenue: 0, vends: 0 }
    existing.revenue += Number(s.amount)
    existing.vends += s.vend_count
    productMap.set(pt, existing)
  })
  const productBreakdown = Array.from(productMap.entries())
    .map(([product, data]) => ({ product, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/machines')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">{machine.serial_number}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {machine.make && <span>{machine.make}</span>}
            {machine.model && <span>{machine.model}</span>}
            {machine.asset_number && <span>Asset: {machine.asset_number}</span>}
          </div>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-xs text-gray-500">Revenue</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500">Vends</p>
          <p className="text-xl font-bold text-gray-900">{formatNumber(totalVends)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500">Avg/Vend</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalVends > 0 ? totalRevenue / totalVends : 0)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-xs text-gray-500">Location</p>
          {location ? (
            <Link href={`/locations/${location.id}`} className="text-blue-600 hover:underline font-medium">
              {location.name}
            </Link>
          ) : (
            <p className="text-gray-400">No location</p>
          )}
        </Card>
      </div>

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

      {/* Product type breakdown */}
      {productBreakdown.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Product Types</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {productBreakdown.map(p => (
              <div key={p.product} className="flex items-center justify-between text-sm">
                <Badge variant="default">{p.product}</Badge>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">{formatNumber(p.vends)} vends</span>
                  <span className="font-medium w-24 text-right">{formatCurrency(p.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
