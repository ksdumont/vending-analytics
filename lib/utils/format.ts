export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`
  return value.toFixed(0)
}

export function parseAmountString(value: string | undefined | null): number {
  if (!value) return 0
  const cleaned = value.toString().replace(/[^0-9.-]/g, '')
  const match = cleaned.match(/-?\d+\.?\d*/)
  return match ? parseFloat(match[0]) : 0
}

export function formatDateRange(start: string, end: string): string {
  const startDate = new Date(start + 'T00:00:00')
  const endDate = new Date(end + 'T00:00:00')
  const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${fmt.format(startDate)} - ${fmt.format(endDate)}`
}
