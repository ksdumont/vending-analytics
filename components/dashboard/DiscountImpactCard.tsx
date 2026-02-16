'use client'

import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils/format'
import type { DiscountSummary } from '@/lib/services/analytics-service'

interface DiscountImpactCardProps {
  data: DiscountSummary
}

export function DiscountImpactCard({ data }: DiscountImpactCardProps) {
  const items = [
    { label: 'Two-Tier Pricing', value: data.twoTierPricing },
    { label: 'Loyalty Discount', value: data.loyaltyDiscount },
    { label: 'Purchase Discount', value: data.purchaseDiscount },
    { label: 'Free Product Discount', value: data.freeProductDiscount },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discounts & Adjustments</CardTitle>
      </CardHeader>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{item.label}</span>
            <span className="text-sm font-medium text-gray-900">{formatCurrency(item.value)}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 pt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">Total</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(data.totalDiscounts)}</span>
        </div>
      </div>
    </Card>
  )
}
