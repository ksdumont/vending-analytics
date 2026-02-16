import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/types/database'
import { ParsedSalesRow, createFingerprint, normalizeName } from './csv-parser'

export interface ImportResult {
  totalRows: number
  importedRows: number
  duplicateRows: number
  regionsCreated: number
  locationsCreated: number
  machinesCreated: number
  errors: string[]
}

export interface ImportProgress {
  stage: 'regions' | 'locations' | 'machines' | 'sales_data'
  current: number
  total: number
  message: string
}

export async function importSalesData(
  supabase: SupabaseClient<Database>,
  userId: string,
  rows: ParsedSalesRow[],
  uploadId: string,
  periodStart: string,
  periodEnd: string,
  onProgress?: (progress: ImportProgress) => void
): Promise<ImportResult> {
  const result: ImportResult = {
    totalRows: rows.length,
    importedRows: 0,
    duplicateRows: 0,
    regionsCreated: 0,
    locationsCreated: 0,
    machinesCreated: 0,
    errors: []
  }

  const regionCache = new Map<string, string>() // normalized_name -> id
  const locationCache = new Map<string, string>() // normalized_name -> id
  const machineCache = new Map<string, string>() // serial_number -> id
  const existingFingerprints = new Set<string>()

  try {
    // Stage 1: Load existing entities + fingerprints
    onProgress?.({ stage: 'regions', current: 0, total: 1, message: 'Loading existing data...' })

    const [regionsRes, locationsRes, machinesRes, fingerprintsRes] = await Promise.all([
      supabase.from('regions').select('id, normalized_name').eq('user_id', userId),
      supabase.from('locations').select('id, normalized_name').eq('user_id', userId),
      supabase.from('machines').select('id, serial_number').eq('user_id', userId),
      supabase.from('sales_data').select('fingerprint').eq('user_id', userId),
    ])

    regionsRes.data?.forEach(r => regionCache.set(r.normalized_name, r.id))
    locationsRes.data?.forEach(l => locationCache.set(l.normalized_name, l.id))
    machinesRes.data?.forEach(m => machineCache.set(m.serial_number, m.id))
    fingerprintsRes.data?.forEach(s => existingFingerprints.add(s.fingerprint))

    // Stage 2: Create regions
    const uniqueRegions = new Map<string, string>() // normalized -> display name
    rows.forEach(row => {
      if (row.region) {
        const normalized = normalizeName(row.region)
        if (!uniqueRegions.has(normalized) && !regionCache.has(normalized)) {
          uniqueRegions.set(normalized, row.region)
        }
      }
    })

    if (uniqueRegions.size > 0) {
      onProgress?.({ stage: 'regions', current: 0, total: uniqueRegions.size, message: `Creating ${uniqueRegions.size} regions...` })

      const regionsToInsert = Array.from(uniqueRegions.entries()).map(([normalized, name]) => ({
        user_id: userId,
        name,
        normalized_name: normalized,
      }))

      const { data: newRegions, error } = await supabase
        .from('regions')
        .insert(regionsToInsert)
        .select('id, normalized_name')

      if (error) {
        result.errors.push(`Error creating regions: ${error.message}`)
      } else {
        newRegions?.forEach(r => regionCache.set(r.normalized_name, r.id))
        result.regionsCreated = newRegions?.length || 0
      }
    }

    // Stage 3: Create locations
    const uniqueLocations = new Map<string, { name: string; regionNormalized: string; locationType: string; city: string; state: string }>()
    rows.forEach(row => {
      if (row.location) {
        const normalized = normalizeName(row.location)
        if (!uniqueLocations.has(normalized) && !locationCache.has(normalized)) {
          uniqueLocations.set(normalized, {
            name: row.location,
            regionNormalized: normalizeName(row.region),
            locationType: row.locationType,
            city: row.city,
            state: row.state,
          })
        }
      }
    })

    if (uniqueLocations.size > 0) {
      onProgress?.({ stage: 'locations', current: 0, total: uniqueLocations.size, message: `Creating ${uniqueLocations.size} locations...` })

      const locationsToInsert = Array.from(uniqueLocations.entries()).map(([normalized, loc]) => ({
        user_id: userId,
        name: loc.name,
        normalized_name: normalized,
        region_id: regionCache.get(loc.regionNormalized) || null,
        location_type: loc.locationType || null,
        city: loc.city || null,
        state: loc.state || null,
      }))

      const { data: newLocations, error } = await supabase
        .from('locations')
        .insert(locationsToInsert)
        .select('id, normalized_name')

      if (error) {
        result.errors.push(`Error creating locations: ${error.message}`)
      } else {
        newLocations?.forEach(l => locationCache.set(l.normalized_name, l.id))
        result.locationsCreated = newLocations?.length || 0
      }
    }

    // Stage 4: Create machines
    const uniqueMachines = new Map<string, { serialNumber: string; assetNumber: string; make: string; model: string; locationNormalized: string; productType: string }>()
    rows.forEach(row => {
      if (row.serialNumber && !machineCache.has(row.serialNumber) && !uniqueMachines.has(row.serialNumber)) {
        uniqueMachines.set(row.serialNumber, {
          serialNumber: row.serialNumber,
          assetNumber: row.assetNumber,
          make: row.make,
          model: row.model,
          locationNormalized: normalizeName(row.location),
          productType: row.productType,
        })
      }
    })

    if (uniqueMachines.size > 0) {
      onProgress?.({ stage: 'machines', current: 0, total: uniqueMachines.size, message: `Creating ${uniqueMachines.size} machines...` })

      const machinesToInsert = Array.from(uniqueMachines.values()).map(m => ({
        user_id: userId,
        serial_number: m.serialNumber,
        asset_number: m.assetNumber || null,
        make: m.make || null,
        model: m.model || null,
        location_id: locationCache.get(m.locationNormalized) || null,
        product_type: m.productType || null,
      }))

      const { data: newMachines, error } = await supabase
        .from('machines')
        .insert(machinesToInsert)
        .select('id, serial_number')

      if (error) {
        result.errors.push(`Error creating machines: ${error.message}`)
      } else {
        newMachines?.forEach(m => machineCache.set(m.serial_number, m.id))
        result.machinesCreated = newMachines?.length || 0
      }
    }

    // Stage 5: Insert sales_data
    const salesToInsert: Array<{
      user_id: string
      upload_id: string
      region_id: string | null
      location_id: string | null
      machine_id: string | null
      period_start: string
      period_end: string
      product_type: string | null
      payment_method: string | null
      payment_category: string | null
      tran_count: number
      vend_count: number
      amount: number
      two_tier_pricing: number
      loyalty_discount: number
      campaign_name: string | null
      purchase_discount: number
      free_product_discount: number
      fingerprint: string
      raw_data: Record<string, string>
    }> = []

    rows.forEach(row => {
      const fingerprint = createFingerprint(
        userId,
        row.serialNumber,
        row.location,
        row.paymentMethod,
        row.productType,
        periodStart,
        periodEnd,
        row.amount,
        row.tranCount
      )

      if (existingFingerprints.has(fingerprint)) {
        result.duplicateRows++
        return
      }

      existingFingerprints.add(fingerprint)

      const regionId = regionCache.get(normalizeName(row.region)) || null
      const locationId = locationCache.get(normalizeName(row.location)) || null
      const machineId = row.serialNumber ? machineCache.get(row.serialNumber) || null : null

      salesToInsert.push({
        user_id: userId,
        upload_id: uploadId,
        region_id: regionId,
        location_id: locationId,
        machine_id: machineId,
        period_start: periodStart,
        period_end: periodEnd,
        product_type: row.productType || null,
        payment_method: row.paymentMethod || null,
        payment_category: row.paymentCategory || null,
        tran_count: row.tranCount,
        vend_count: row.vendCount,
        amount: row.amount,
        two_tier_pricing: row.twoTierPricing,
        loyalty_discount: row.loyaltyDiscount,
        campaign_name: row.campaignName || null,
        purchase_discount: row.purchaseDiscount,
        free_product_discount: row.freeProductDiscount,
        fingerprint,
        raw_data: row.raw,
      })
    })

    // Insert in batches
    const batchSize = 100
    for (let i = 0; i < salesToInsert.length; i += batchSize) {
      const batch = salesToInsert.slice(i, i + batchSize)

      onProgress?.({
        stage: 'sales_data',
        current: i,
        total: salesToInsert.length,
        message: `Importing rows ${i + 1} - ${Math.min(i + batchSize, salesToInsert.length)}...`
      })

      const { error } = await supabase
        .from('sales_data')
        .insert(batch)

      if (error) {
        result.errors.push(`Error inserting batch ${Math.floor(i / batchSize) + 1}: ${error.message}`)
      } else {
        result.importedRows += batch.length
      }
    }

  } catch (error) {
    result.errors.push(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  return result
}
