'use client'

import { useState } from 'react'
import { useAnalytics } from '@/lib/hooks/useAnalytics'
import { KPICards } from '@/components/dashboard/KPICards'
import { RevenueByRegionChart } from '@/components/dashboard/RevenueByRegionChart'
import { ProductTypePieChart } from '@/components/dashboard/ProductTypePieChart'
import { PaymentBreakdownChart } from '@/components/dashboard/PaymentBreakdownChart'
import { TopLocationsTable } from '@/components/dashboard/TopLocationsTable'
import { TopMachinesTable } from '@/components/dashboard/TopMachinesTable'
import { DiscountImpactCard } from '@/components/dashboard/DiscountImpactCard'
import { LocationTypeChart } from '@/components/dashboard/LocationTypeChart'
import { InsightsPanel } from '@/components/dashboard/InsightsPanel'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton, ChartSkeleton, TableSkeleton } from '@/components/ui/Skeleton'
import { Select } from '@/components/ui/Select'
import { AlertCircle, Upload } from 'lucide-react'

export default function DashboardPage() {
  const [dateFilter, setDateFilter] = useState('all')
  const { data, loading, error } = useAnalytics()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
        <TableSkeleton rows={5} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (!data || data.kpi.totalVends === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <EmptyState
          icon={Upload}
          title="No Data Yet"
          description="Upload your first CSV file to start tracking your vending revenue and analytics."
          actionLabel="Upload CSV"
          actionHref="/upload"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Overview of your vending business performance</p>
        </div>
        <Select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Time' },
          ]}
        />
      </div>

      {/* KPI Cards */}
      <KPICards data={data.kpi} />

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueByRegionChart data={data.revenueByRegion} />
        <ProductTypePieChart data={data.productTypes} />
      </div>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PaymentBreakdownChart data={data.paymentBreakdown} totalRevenue={data.kpi.totalRevenue} />
        </div>
        <div className="space-y-6">
          <DiscountImpactCard data={data.discounts} />
          <InsightsPanel insights={data.insights} />
        </div>
      </div>

      {/* Location Type Comparison */}
      <LocationTypeChart data={data.locationTypeComparison} />

      {/* Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <TopLocationsTable data={data.topLocations} />
        <TopMachinesTable data={data.topMachines} />
      </div>
    </div>
  )
}
