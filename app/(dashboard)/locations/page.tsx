'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { MapPin, Search, ChevronRight } from 'lucide-react'
import type { Region, Location } from '@/lib/types/database'

interface LocationWithStats extends Location {
  revenue: number
  vendCount: number
  machineCount: number
}

interface RegionGroup {
  region: Region
  locations: LocationWithStats[]
  totalRevenue: number
}

export default function LocationsPage() {
  const { user } = useAuth()
  const [regionGroups, setRegionGroups] = useState<RegionGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const supabase = createClient()

      const [regionsRes, locationsRes, salesRes, machinesRes] = await Promise.all([
        supabase.from('regions').select('*').eq('user_id', user.id),
        supabase.from('locations').select('*').eq('user_id', user.id),
        supabase.from('sales_data').select('location_id, amount, vend_count, machine_id').eq('user_id', user.id),
        supabase.from('machines').select('id, location_id').eq('user_id', user.id),
      ])

      const regions = regionsRes.data || []
      const locations = locationsRes.data || []
      const sales = salesRes.data || []
      const machines = machinesRes.data || []

      const locationStats = new Map<string, { revenue: number; vendCount: number; machineIds: Set<string> }>()
      sales.forEach(s => {
        if (!s.location_id) return
        const existing = locationStats.get(s.location_id) || { revenue: 0, vendCount: 0, machineIds: new Set() }
        existing.revenue += Number(s.amount)
        existing.vendCount += s.vend_count
        if (s.machine_id) existing.machineIds.add(s.machine_id)
        locationStats.set(s.location_id, existing)
      })

      const machinesByLocation = new Map<string, number>()
      machines.forEach(m => {
        if (m.location_id) {
          machinesByLocation.set(m.location_id, (machinesByLocation.get(m.location_id) || 0) + 1)
        }
      })

      const locationWithStats: LocationWithStats[] = locations.map(loc => {
        const stats = locationStats.get(loc.id) || { revenue: 0, vendCount: 0, machineIds: new Set() }
        return {
          ...loc,
          revenue: stats.revenue,
          vendCount: stats.vendCount,
          machineCount: machinesByLocation.get(loc.id) || stats.machineIds.size,
        }
      })

      const regionMap = new Map(regions.map(r => [r.id, r]))
      const groupsMap = new Map<string, LocationWithStats[]>()
      const noRegion: LocationWithStats[] = []

      locationWithStats.forEach(loc => {
        if (loc.region_id && regionMap.has(loc.region_id)) {
          const existing = groupsMap.get(loc.region_id) || []
          existing.push(loc)
          groupsMap.set(loc.region_id, existing)
        } else {
          noRegion.push(loc)
        }
      })

      const groups: RegionGroup[] = Array.from(groupsMap.entries()).map(([regionId, locs]) => ({
        region: regionMap.get(regionId)!,
        locations: locs.sort((a, b) => b.revenue - a.revenue),
        totalRevenue: locs.reduce((sum, l) => sum + l.revenue, 0),
      }))

      if (noRegion.length > 0) {
        groups.push({
          region: { id: 'none', user_id: user.id, name: 'No Region', normalized_name: 'noregion', created_at: '', updated_at: '' },
          locations: noRegion.sort((a, b) => b.revenue - a.revenue),
          totalRevenue: noRegion.reduce((sum, l) => sum + l.revenue, 0),
        })
      }

      groups.sort((a, b) => b.totalRevenue - a.totalRevenue)
      setRegionGroups(groups)
      setLoading(false)
    }

    fetchData()
  }, [user])

  const filtered = useMemo(() => {
    if (!search) return regionGroups
    const q = search.toLowerCase()
    return regionGroups
      .map(g => ({
        ...g,
        locations: g.locations.filter(l =>
          l.name.toLowerCase().includes(q) ||
          l.location_type?.toLowerCase().includes(q) ||
          g.region.name.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.locations.length > 0)
  }, [regionGroups, search])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (regionGroups.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Locations</h1>
        <Card>
          <EmptyState
            icon={MapPin}
            title="No Locations Yet"
            description="Upload a CSV file to automatically create locations from your sales data."
            actionLabel="Upload CSV"
            actionHref="/upload"
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search locations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {filtered.map(group => (
        <div key={group.region.id}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">{group.region.name}</h2>
            <span className="text-sm text-gray-500">
              {group.locations.length} location{group.locations.length !== 1 ? 's' : ''} &middot; {formatCurrency(group.totalRevenue)}
            </span>
          </div>
          <div className="grid gap-3">
            {group.locations.map(loc => (
              <Link key={loc.id} href={`/locations/${loc.id}`}>
                <Card padding="sm" className="hover:border-blue-300 hover:shadow transition-all cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{loc.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {loc.location_type && loc.location_type !== '- Not Assigned -' && <Badge variant="default">{loc.location_type}</Badge>}
                          {loc.city && <span>{loc.city}, {loc.state}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(loc.revenue)}</p>
                        <p className="text-xs text-gray-500">{formatNumber(loc.vendCount)} vends</p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-sm text-gray-700">{loc.machineCount}</p>
                        <p className="text-xs text-gray-500">machines</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
