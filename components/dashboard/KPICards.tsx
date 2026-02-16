'use client'

import { DollarSign, ShoppingCart, TrendingUp, Monitor, MapPin, Smartphone } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/format'
import type { KPIData } from '@/lib/services/analytics-service'

interface KPICardsProps {
  data: KPIData
}

export function KPICards({ data }: KPICardsProps) {
  const cards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(data.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Total Vends',
      value: formatNumber(data.totalVends),
      icon: ShoppingCart,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Avg Revenue/Vend',
      value: formatCurrency(data.avgRevenuePerVend),
      icon: TrendingUp,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      label: 'Active Machines',
      value: formatNumber(data.activeMachines),
      icon: Monitor,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      label: 'Active Locations',
      value: formatNumber(data.activeLocations),
      icon: MapPin,
      color: 'text-cyan-600',
      bg: 'bg-cyan-100',
    },
    {
      label: 'Digital Payment %',
      value: formatPercent(data.digitalPaymentPercent),
      icon: Smartphone,
      color: 'text-indigo-600',
      bg: 'bg-indigo-100',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} padding="sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 truncate">{card.label}</p>
                <p className="text-lg font-bold text-gray-900 truncate">{card.value}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
