'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { PAYMENT_CATEGORIES, type PaymentCategory } from '@/lib/utils/constants'
import type { PaymentBreakdown } from '@/lib/services/analytics-service'

interface PaymentBreakdownChartProps {
  data: PaymentBreakdown[]
  totalRevenue: number
}

export function PaymentBreakdownChart({ data, totalRevenue }: PaymentBreakdownChartProps) {
  const chartData = data.map(d => ({
    ...d,
    label: PAYMENT_CATEGORIES[d.paymentCategory as PaymentCategory] || d.paymentCategory,
  }))

  // Cash vs Digital summary
  const cashRevenue = data.find(d => d.paymentCategory === 'cash')?.revenue || 0
  const digitalRevenue = totalRevenue - cashRevenue

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method Breakdown</CardTitle>
      </CardHeader>

      {/* Cash vs Digital summary bar */}
      <div className="mb-4 px-1">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Cash: {formatCurrency(cashRevenue)}</span>
          <span>Digital: {formatCurrency(digitalRevenue)}</span>
        </div>
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-100">
          {totalRevenue > 0 && (
            <>
              <div
                className="bg-green-500"
                style={{ width: `${(cashRevenue / totalRevenue) * 100}%` }}
              />
              <div
                className="bg-blue-500"
                style={{ width: `${(digitalRevenue / totalRevenue) * 100}%` }}
              />
            </>
          )}
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(Number(value ?? 0)) : formatNumber(Number(value ?? 0)),
                name === 'revenue' ? 'Revenue' : 'Transactions'
              ]}
            />
            <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Table detail */}
      <div className="mt-4 border-t border-gray-100 pt-3">
        <div className="space-y-2">
          {data.map(d => (
            <div key={d.paymentCategory} className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {PAYMENT_CATEGORIES[d.paymentCategory as PaymentCategory] || d.paymentCategory}
              </span>
              <div className="flex items-center gap-4">
                <span className="text-gray-500">{formatNumber(d.tranCount)} txns</span>
                <span className="font-medium text-gray-900 w-24 text-right">{formatCurrency(d.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
