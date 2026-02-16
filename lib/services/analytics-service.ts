import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'

export interface KPIData {
  totalRevenue: number
  totalVends: number
  avgRevenuePerVend: number
  activeMachines: number
  activeLocations: number
  digitalPaymentPercent: number
}

export interface RegionRevenue {
  region: string
  revenue: number
  vends: number
}

export interface ProductTypeBreakdown {
  productType: string
  revenue: number
  vends: number
}

export interface PaymentBreakdown {
  paymentCategory: string
  revenue: number
  tranCount: number
}

export interface TopLocation {
  id: string
  name: string
  region: string
  locationType: string
  revenue: number
  vends: number
  avgPerVend: number
  machineCount: number
}

export interface TopMachine {
  id: string
  serialNumber: string
  make: string
  model: string
  location: string
  revenue: number
  vends: number
}

export interface DiscountSummary {
  twoTierPricing: number
  loyaltyDiscount: number
  purchaseDiscount: number
  freeProductDiscount: number
  totalDiscounts: number
}

export interface LocationTypeAvg {
  locationType: string
  avgRevenue: number
  locationCount: number
}

export interface AnalyticsData {
  kpi: KPIData
  revenueByRegion: RegionRevenue[]
  productTypes: ProductTypeBreakdown[]
  paymentBreakdown: PaymentBreakdown[]
  topLocations: TopLocation[]
  topMachines: TopMachine[]
  discounts: DiscountSummary
  locationTypeComparison: LocationTypeAvg[]
  insights: string[]
}

export async function fetchAnalytics(
  supabase: SupabaseClient<Database>,
  userId: string,
  periodStart?: string,
  periodEnd?: string
): Promise<AnalyticsData> {
  // Build base query filter
  let salesQuery = supabase
    .from('sales_data')
    .select('*')
    .eq('user_id', userId)

  if (periodStart) salesQuery = salesQuery.gte('period_start', periodStart)
  if (periodEnd) salesQuery = salesQuery.lte('period_end', periodEnd)

  const { data: salesData } = await salesQuery

  const sales = salesData || []

  // Also fetch joined data for locations and machines
  const [locationsRes, machinesRes, regionsRes] = await Promise.all([
    supabase.from('locations').select('*').eq('user_id', userId),
    supabase.from('machines').select('*').eq('user_id', userId),
    supabase.from('regions').select('*').eq('user_id', userId),
  ])

  const locations = locationsRes.data || []
  const machines = machinesRes.data || []
  const regions = regionsRes.data || []

  // Build lookup maps
  const locationMap = new Map(locations.map(l => [l.id, l]))
  const machineMap = new Map(machines.map(m => [m.id, m]))
  const regionMap = new Map(regions.map(r => [r.id, r]))

  // KPIs
  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.amount), 0)
  const totalVends = sales.reduce((sum, s) => sum + s.vend_count, 0)
  const avgRevenuePerVend = totalVends > 0 ? totalRevenue / totalVends : 0

  const activeMachineIds = new Set(sales.filter(s => s.machine_id).map(s => s.machine_id))
  const activeLocationIds = new Set(sales.filter(s => s.location_id).map(s => s.location_id))

  const digitalCategories = new Set(['credit', 'apple_pay', 'google_pay', 'contactless'])
  const digitalRevenue = sales
    .filter(s => digitalCategories.has(s.payment_category || ''))
    .reduce((sum, s) => sum + Number(s.amount), 0)
  const digitalPaymentPercent = totalRevenue > 0 ? (digitalRevenue / totalRevenue) * 100 : 0

  const kpi: KPIData = {
    totalRevenue,
    totalVends,
    avgRevenuePerVend,
    activeMachines: activeMachineIds.size,
    activeLocations: activeLocationIds.size,
    digitalPaymentPercent,
  }

  // Revenue by region
  const regionRevenueMap = new Map<string, { revenue: number; vends: number }>()
  sales.forEach(s => {
    const region = s.region_id ? regionMap.get(s.region_id)?.name || 'Unknown' : 'Unknown'
    const existing = regionRevenueMap.get(region) || { revenue: 0, vends: 0 }
    existing.revenue += Number(s.amount)
    existing.vends += s.vend_count
    regionRevenueMap.set(region, existing)
  })
  const revenueByRegion: RegionRevenue[] = Array.from(regionRevenueMap.entries())
    .map(([region, data]) => ({ region, ...data }))
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
  const productTypes: ProductTypeBreakdown[] = Array.from(productMap.entries())
    .map(([productType, data]) => ({ productType, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Payment breakdown
  const paymentMap = new Map<string, { revenue: number; tranCount: number }>()
  sales.forEach(s => {
    const cat = s.payment_category || 'other'
    const existing = paymentMap.get(cat) || { revenue: 0, tranCount: 0 }
    existing.revenue += Number(s.amount)
    existing.tranCount += s.tran_count
    paymentMap.set(cat, existing)
  })
  const paymentBreakdown: PaymentBreakdown[] = Array.from(paymentMap.entries())
    .map(([paymentCategory, data]) => ({ paymentCategory, ...data }))
    .sort((a, b) => b.revenue - a.revenue)

  // Top locations
  const locationRevenueMap = new Map<string, { revenue: number; vends: number; machineIds: Set<string> }>()
  sales.forEach(s => {
    if (!s.location_id) return
    const existing = locationRevenueMap.get(s.location_id) || { revenue: 0, vends: 0, machineIds: new Set() }
    existing.revenue += Number(s.amount)
    existing.vends += s.vend_count
    if (s.machine_id) existing.machineIds.add(s.machine_id)
    locationRevenueMap.set(s.location_id, existing)
  })
  const topLocations: TopLocation[] = Array.from(locationRevenueMap.entries())
    .map(([locId, data]) => {
      const loc = locationMap.get(locId)
      const regionName = loc?.region_id ? regionMap.get(loc.region_id)?.name || '' : ''
      return {
        id: locId,
        name: loc?.name || 'Unknown',
        region: regionName,
        locationType: loc?.location_type || '',
        revenue: data.revenue,
        vends: data.vends,
        avgPerVend: data.vends > 0 ? data.revenue / data.vends : 0,
        machineCount: data.machineIds.size,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20)

  // Top machines
  const machineRevenueMap = new Map<string, { revenue: number; vends: number }>()
  sales.forEach(s => {
    if (!s.machine_id) return
    const existing = machineRevenueMap.get(s.machine_id) || { revenue: 0, vends: 0 }
    existing.revenue += Number(s.amount)
    existing.vends += s.vend_count
    machineRevenueMap.set(s.machine_id, existing)
  })
  const topMachines: TopMachine[] = Array.from(machineRevenueMap.entries())
    .map(([machId, data]) => {
      const mach = machineMap.get(machId)
      const loc = mach?.location_id ? locationMap.get(mach.location_id) : null
      return {
        id: machId,
        serialNumber: mach?.serial_number || 'Unknown',
        make: mach?.make || '',
        model: mach?.model || '',
        location: loc?.name || 'Unknown',
        revenue: data.revenue,
        vends: data.vends,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 20)

  // Discount summary
  const discounts: DiscountSummary = {
    twoTierPricing: sales.reduce((sum, s) => sum + Number(s.two_tier_pricing || 0), 0),
    loyaltyDiscount: sales.reduce((sum, s) => sum + Number(s.loyalty_discount || 0), 0),
    purchaseDiscount: sales.reduce((sum, s) => sum + Number(s.purchase_discount || 0), 0),
    freeProductDiscount: sales.reduce((sum, s) => sum + Number(s.free_product_discount || 0), 0),
    totalDiscounts: 0,
  }
  discounts.totalDiscounts = discounts.twoTierPricing + discounts.loyaltyDiscount +
    discounts.purchaseDiscount + discounts.freeProductDiscount

  // Location type comparison
  const locTypeMap = new Map<string, { totalRevenue: number; locationIds: Set<string> }>()
  sales.forEach(s => {
    if (!s.location_id) return
    const loc = locationMap.get(s.location_id)
    const locType = loc?.location_type || 'Not Assigned'
    const existing = locTypeMap.get(locType) || { totalRevenue: 0, locationIds: new Set() }
    existing.totalRevenue += Number(s.amount)
    existing.locationIds.add(s.location_id)
    locTypeMap.set(locType, existing)
  })
  const locationTypeComparison: LocationTypeAvg[] = Array.from(locTypeMap.entries())
    .map(([locationType, data]) => ({
      locationType,
      avgRevenue: data.locationIds.size > 0 ? data.totalRevenue / data.locationIds.size : 0,
      locationCount: data.locationIds.size,
    }))
    .sort((a, b) => b.avgRevenue - a.avgRevenue)

  // Auto-generated insights
  const insights: string[] = []

  if (revenueByRegion.length > 0) {
    insights.push(`Top region: ${revenueByRegion[0].region} with $${revenueByRegion[0].revenue.toFixed(0)} in revenue`)
  }

  if (digitalPaymentPercent > 0) {
    insights.push(`${digitalPaymentPercent.toFixed(1)}% of revenue comes from digital payments`)
  }

  const zeroRevenueMachines = machines.filter(m => !machineRevenueMap.has(m.id))
  if (zeroRevenueMachines.length > 0) {
    insights.push(`${zeroRevenueMachines.length} machine(s) with zero revenue in this period`)
  }

  if (locationTypeComparison.length > 0) {
    insights.push(`Best location type: ${locationTypeComparison[0].locationType} (avg $${locationTypeComparison[0].avgRevenue.toFixed(0)}/location)`)
  }

  if (discounts.totalDiscounts > 0) {
    insights.push(`Total discounts/adjustments: $${discounts.totalDiscounts.toFixed(2)}`)
  }

  const cashRevenue = paymentBreakdown.find(p => p.paymentCategory === 'cash')?.revenue || 0
  if (totalRevenue > 0 && cashRevenue > 0) {
    insights.push(`Cash is ${((cashRevenue / totalRevenue) * 100).toFixed(1)}% of revenue`)
  }

  return {
    kpi,
    revenueByRegion,
    productTypes,
    paymentBreakdown,
    topLocations,
    topMachines,
    discounts,
    locationTypeComparison,
    insights,
  }
}
