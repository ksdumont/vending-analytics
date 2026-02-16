import Papa from 'papaparse'
import { normalizePaymentCategory } from '@/lib/utils/constants'
import { parseAmountString } from '@/lib/utils/format'
import type { Platform } from '@/lib/utils/constants'

export interface CsvColumnMapping {
  customer?: string
  region?: string
  location?: string
  locationType?: string
  serialNumber?: string
  assetNumber?: string
  make?: string
  model?: string
  city?: string
  state?: string
  productType?: string
  transTypeName?: string
  tranCount?: string
  vendCount?: string
  amount?: string
  currencyCode?: string
  twoTierPricing?: string
  loyaltyDiscount?: string
  campaignName?: string
  purchaseDiscount?: string
  freeProductDiscount?: string
}

export interface ParsedSalesRow {
  customer: string
  region: string
  location: string
  locationType: string
  serialNumber: string
  assetNumber: string
  make: string
  model: string
  city: string
  state: string
  productType: string
  paymentMethod: string
  paymentCategory: string
  tranCount: number
  vendCount: number
  amount: number
  twoTierPricing: number
  loyaltyDiscount: number
  campaignName: string
  purchaseDiscount: number
  freeProductDiscount: number
  raw: Record<string, string>
}

export interface ParseResult {
  rows: ParsedSalesRow[]
  headers: string[]
  platform: Platform
  mapping: CsvColumnMapping
  errors: string[]
}

// Auto-detect platform by examining headers
export function detectPlatform(headers: string[]): Platform {
  const headerSet = new Set(headers.map(h => h.trim()))

  // Cantaloupe: has specific headers like "Trans Type Name", "Serial #", "Two-Tier Pricing"
  const cantaloupeMarkers = ['Trans Type Name', 'Serial #', 'Tran Count', 'Vend Count']
  const cantaloupeMatches = cantaloupeMarkers.filter(m => headerSet.has(m))
  if (cantaloupeMatches.length >= 3) return 'cantaloupe'

  // Nayax markers
  if (headerSet.has('Machine ID') || headerSet.has('Nayax ID')) return 'nayax'

  // PayRange markers
  if (headerSet.has('PayRange ID') || headerSet.has('Beacon ID')) return 'payrange'

  return 'custom'
}

// Built-in Cantaloupe column mapping
function getCantaloupeMapping(headers: string[]): CsvColumnMapping {
  const mapping: CsvColumnMapping = {}
  const headerSet = new Set(headers)

  // Exact matches for Cantaloupe CSV headers
  if (headerSet.has('Customer')) mapping.customer = 'Customer'
  if (headerSet.has('Region')) mapping.region = 'Region'
  if (headerSet.has('Location')) mapping.location = 'Location'
  if (headerSet.has('Location Type')) mapping.locationType = 'Location Type'
  if (headerSet.has('Serial #')) mapping.serialNumber = 'Serial #'
  if (headerSet.has('Asset #')) mapping.assetNumber = 'Asset #'
  if (headerSet.has('Make')) mapping.make = 'Make'
  if (headerSet.has('Model')) mapping.model = 'Model'
  if (headerSet.has('City')) mapping.city = 'City'
  if (headerSet.has('State')) mapping.state = 'State'
  if (headerSet.has('Product Type')) mapping.productType = 'Product Type'
  if (headerSet.has('Trans Type Name')) mapping.transTypeName = 'Trans Type Name'
  if (headerSet.has('Tran Count')) mapping.tranCount = 'Tran Count'
  if (headerSet.has('Vend Count')) mapping.vendCount = 'Vend Count'
  if (headerSet.has('Amount')) mapping.amount = 'Amount'
  if (headerSet.has('Currency Code')) mapping.currencyCode = 'Currency Code'

  // Handle the long-form header names
  const twoTier = headers.find(h => /two.tier\s*pricing/i.test(h))
  if (twoTier) mapping.twoTierPricing = twoTier

  const loyalty = headers.find(h => /loyalty\s*discount/i.test(h))
  if (loyalty) mapping.loyaltyDiscount = loyalty

  if (headerSet.has('Campaign Name')) mapping.campaignName = 'Campaign Name'

  const purchase = headers.find(h => /purchase\s*discount/i.test(h))
  if (purchase) mapping.purchaseDiscount = purchase

  const free = headers.find(h => /free\s*product\s*discount/i.test(h))
  if (free) mapping.freeProductDiscount = free

  return mapping
}

// Generic column detection for non-Cantaloupe CSVs
function detectGenericMapping(headers: string[]): CsvColumnMapping {
  const mapping: CsvColumnMapping = {}

  for (const header of headers) {
    const h = header.trim()
    if (/^region$/i.test(h)) mapping.region = header
    else if (/^(location|site)$/i.test(h)) mapping.location = header
    else if (/location\s*type/i.test(h)) mapping.locationType = header
    else if (/serial/i.test(h)) mapping.serialNumber = header
    else if (/asset/i.test(h)) mapping.assetNumber = header
    else if (/^make$/i.test(h)) mapping.make = header
    else if (/^model$/i.test(h)) mapping.model = header
    else if (/^city$/i.test(h)) mapping.city = header
    else if (/^state$/i.test(h)) mapping.state = header
    else if (/product\s*type/i.test(h)) mapping.productType = header
    else if (/trans.*type|payment.*method|payment.*type/i.test(h)) mapping.transTypeName = header
    else if (/tran.*count/i.test(h)) mapping.tranCount = header
    else if (/vend.*count/i.test(h)) mapping.vendCount = header
    else if (/^amount$|^total|^revenue|^net\s*revenue/i.test(h) && !mapping.amount) mapping.amount = header
  }

  return mapping
}

// Get mapping based on platform
export function getColumnMapping(headers: string[], platform: Platform): CsvColumnMapping {
  if (platform === 'cantaloupe') return getCantaloupeMapping(headers)
  return detectGenericMapping(headers)
}

// Extract date range from filename like "Sales Rollup - From 10-01-2025 to 12-31-2025.csv"
export function extractDateRangeFromFilename(filename: string): { startDate: string; endDate: string } | null {
  const pattern = /from\s+(\d{1,2}-\d{1,2}-\d{4})\s+to\s+(\d{1,2}-\d{1,2}-\d{4})/i
  const match = filename.match(pattern)

  if (match) {
    const convertDate = (dateStr: string) => {
      const [month, day, year] = dateStr.split('-')
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    }
    return {
      startDate: convertDate(match[1]),
      endDate: convertDate(match[2])
    }
  }

  return null
}

// Create fingerprint for deduplication
export function createFingerprint(
  userId: string,
  serialNumber: string,
  location: string,
  paymentMethod: string,
  productType: string,
  periodStart: string,
  periodEnd: string,
  amount: number,
  tranCount: number
): string {
  const data = `${userId}|${serialNumber}|${location}|${paymentMethod}|${productType}|${periodStart}|${periodEnd}|${amount}|${tranCount}`
  // Use a simple hash since we're in the browser (no crypto.createHash)
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  // Convert to hex-like string for consistency
  return Math.abs(hash).toString(16).padStart(8, '0') + '-' + data.length.toString(16)
}

// Normalize name for deduplication (case-insensitive, stripped)
export function normalizeName(name: string): string {
  return (name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '')
}

// Parse CSV file
export function parseCSV(
  fileContent: string,
  customMapping?: CsvColumnMapping
): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        const errors: string[] = []

        const platform = detectPlatform(headers)
        const mapping = customMapping || getColumnMapping(headers, platform)

        const rows: ParsedSalesRow[] = (results.data as Record<string, string>[]).map((rawRow) => {
          const getValue = (key: keyof CsvColumnMapping): string => {
            const col = mapping[key]
            return col ? (rawRow[col] || '').trim() : ''
          }

          const paymentMethod = getValue('transTypeName')

          return {
            customer: getValue('customer'),
            region: getValue('region'),
            location: getValue('location'),
            locationType: getValue('locationType'),
            serialNumber: getValue('serialNumber'),
            assetNumber: getValue('assetNumber'),
            make: getValue('make'),
            model: getValue('model'),
            city: getValue('city'),
            state: getValue('state'),
            productType: getValue('productType'),
            paymentMethod,
            paymentCategory: normalizePaymentCategory(paymentMethod),
            tranCount: parseInt(getValue('tranCount')) || 0,
            vendCount: parseInt(getValue('vendCount')) || 0,
            amount: parseAmountString(getValue('amount')),
            twoTierPricing: parseAmountString(getValue('twoTierPricing')),
            loyaltyDiscount: parseAmountString(getValue('loyaltyDiscount')),
            campaignName: getValue('campaignName'),
            purchaseDiscount: parseAmountString(getValue('purchaseDiscount')),
            freeProductDiscount: parseAmountString(getValue('freeProductDiscount')),
            raw: rawRow,
          }
        })

        resolve({ rows, headers, platform, mapping, errors })
      },
      error: (error: Error) => {
        reject(error)
      }
    })
  })
}
