'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import { fetchAnalytics, type AnalyticsData } from '@/lib/services/analytics-service'

export function useAnalytics(periodStart?: string, periodEnd?: string) {
  const { user } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const result = await fetchAnalytics(supabase, user.id, periodStart, periodEnd)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [user, periodStart, periodEnd])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}
