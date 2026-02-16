'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/format'
import type { LocationTypeAvg } from '@/lib/services/analytics-service'

interface LocationTypeChartProps {
  data: LocationTypeAvg[]
}

export function LocationTypeChart({ data }: LocationTypeChartProps) {
  const chartData = data.slice(0, 8).map(d => ({
    ...d,
    locationType: d.locationType.length > 25 ? d.locationType.slice(0, 23) + '...' : d.locationType,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avg Revenue by Location Type</CardTitle>
      </CardHeader>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="locationType" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              formatter={(value) => formatCurrency(Number(value ?? 0))}
              labelFormatter={(label) => `Type: ${label}`}
            />
            <Bar dataKey="avgRevenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Avg Revenue/Location" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
