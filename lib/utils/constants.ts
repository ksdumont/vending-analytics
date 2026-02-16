export const PAYMENT_CATEGORIES = {
  cash: 'Cash',
  credit: 'Credit Card',
  apple_pay: 'Apple Pay',
  google_pay: 'Google Pay',
  contactless: 'Contactless',
  access: 'Access',
  chargeback: 'Chargeback',
  other: 'Other',
} as const

export type PaymentCategory = keyof typeof PAYMENT_CATEGORIES

export const PRODUCT_TYPES = {
  vending: 'Vending',
  soft_drink: 'Soft Drink',
  snack: 'Snack',
  water: 'Water',
  coffee: 'Coffee',
  not_assigned: '- Not Assigned -',
  other: 'Other',
} as const

export type ProductType = keyof typeof PRODUCT_TYPES

export const LOCATION_TYPES = {
  'Business / Professional Office': 'Office',
  'Hospital / Healthcare': 'Healthcare',
  'Education / College': 'Education',
  'Factory / Industrial': 'Industrial',
  'Government / Military': 'Government',
  'Hotel / Lodging': 'Lodging',
  'Retail / Shopping': 'Retail',
  'Recreation / Entertainment': 'Recreation',
  'Transportation': 'Transportation',
  '- Not Assigned -': 'Not Assigned',
} as const

export const PLATFORMS = {
  cantaloupe: 'Cantaloupe',
  nayax: 'Nayax',
  payrange: 'PayRange',
  custom: 'Custom',
} as const

export type Platform = keyof typeof PLATFORMS

// Cantaloupe CSV column headers (all 21)
export const CANTALOUPE_HEADERS = [
  'Customer',
  'Region',
  'Location',
  'Location Type',
  'Serial #',
  'Asset #',
  'Make',
  'Model',
  'City',
  'State',
  'Product Type',
  'Trans Type Name',
  'Tran Count',
  'Vend Count',
  'Amount',
  'Currency Code',
  'Two-Tier Pricing (Included in Net Revenue)',
  'Loyalty Discount',
  'Campaign Name',
  'Purchase Discount',
  'Free Product Discount',
] as const

// Map Trans Type Name values to normalized payment categories
export function normalizePaymentCategory(transTypeName: string): PaymentCategory {
  const value = (transTypeName || '').trim()

  if (/^cash$/i.test(value)) return 'cash'
  if (/apple\s*pay/i.test(value)) return 'apple_pay'
  if (/google\s*pay/i.test(value)) return 'google_pay'
  if (/contactless|emv\s*contactless/i.test(value) && !/apple/i.test(value) && !/google/i.test(value)) return 'contactless'
  if (/chargeback/i.test(value)) return 'chargeback'
  if (/^access$/i.test(value)) return 'access'
  if (/^credit/i.test(value)) return 'credit'

  return 'other'
}

// Normalize product type from CSV value
export function normalizeProductType(productType: string): string {
  const value = (productType || '').trim().toLowerCase()

  if (value === 'vending') return 'Vending'
  if (value === 'soft drink') return 'Soft Drink'
  if (value === 'snack') return 'Snack'
  if (value === 'water') return 'Water'
  if (value === 'coffee') return 'Coffee'
  if (value === '- not assigned -') return '- Not Assigned -'

  return productType?.trim() || 'Other'
}
