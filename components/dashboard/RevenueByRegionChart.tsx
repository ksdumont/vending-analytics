'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/format'
import type { RegionRevenue } from '@/lib/services/analytics-service'

interface RevenueByRegionChartProps {
  data: RegionRevenue[]
}

export function RevenueByRegionChart({ data }: RevenueByRegionChartProps) {
  const chartData = data.slice(0, 10).map(d => ({
    ...d,
    region: d.region.length > 20 ? d.region.slice(0, 18) + '...' : d.region,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Region</CardTitle>
      </CardHeader>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <YAxis type="category" dataKey="region" width={120} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
