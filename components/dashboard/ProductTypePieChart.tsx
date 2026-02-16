'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/format'
import type { ProductTypeBreakdown } from '@/lib/services/analytics-service'

interface ProductTypePieChartProps {
  data: ProductTypeBreakdown[]
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export function ProductTypePieChart({ data }: ProductTypePieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue by Product Type</CardTitle>
      </CardHeader>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.map(d => ({ ...d }))}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="revenue"
              nameKey="productType"
            >
              {data.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
