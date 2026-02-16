export type Profile = {
  id: string
  user_id: string
  business_name: string | null
  company_name: string | null
  timezone: string
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export type Region = {
  id: string
  user_id: string
  name: string
  normalized_name: string
  created_at: string
  updated_at: string
}

export type Location = {
  id: string
  user_id: string
  region_id: string | null
  name: string
  normalized_name: string
  location_type: string | null
  city: string | null
  state: string | null
  created_at: string
  updated_at: string
}

export type Machine = {
  id: string
  user_id: string
  location_id: string | null
  serial_number: string
  asset_number: string | null
  make: string | null
  model: string | null
  product_type: string | null
  created_at: string
  updated_at: string
}

export type SalesData = {
  id: string
  user_id: string
  upload_id: string | null
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
  raw_data: Record<string, unknown> | null
  created_at: string
}

export type CsvUpload = {
  id: string
  user_id: string
  filename: string
  platform: string
  period_start: string | null
  period_end: string | null
  mapping_id: string | null
  status: 'pending' | 'processing' | 'completed' | 'failed'
  total_rows: number
  imported_rows: number
  duplicate_rows: number
  error_message: string | null
  created_at: string
  completed_at: string | null
}

export type ColumnMapping = {
  id: string
  user_id: string
  mapping_name: string
  platform: string
  column_mappings: Record<string, string>
  is_default: boolean
  created_at: string
  updated_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: {
          user_id: string
          business_name?: string | null
          company_name?: string | null
          timezone?: string
          onboarding_completed?: boolean
        }
        Update: {
          business_name?: string | null
          company_name?: string | null
          timezone?: string
          onboarding_completed?: boolean
        }
        Relationships: []
      }
      regions: {
        Row: Region
        Insert: {
          user_id: string
          name: string
          normalized_name: string
        }
        Update: {
          name?: string
          normalized_name?: string
        }
        Relationships: []
      }
      locations: {
        Row: Location
        Insert: {
          user_id: string
          name: string
          normalized_name: string
          region_id?: string | null
          location_type?: string | null
          city?: string | null
          state?: string | null
        }
        Update: {
          name?: string
          normalized_name?: string
          region_id?: string | null
          location_type?: string | null
          city?: string | null
          state?: string | null
        }
        Relationships: []
      }
      machines: {
        Row: Machine
        Insert: {
          user_id: string
          serial_number: string
          location_id?: string | null
          asset_number?: string | null
          make?: string | null
          model?: string | null
          product_type?: string | null
        }
        Update: {
          serial_number?: string
          location_id?: string | null
          asset_number?: string | null
          make?: string | null
          model?: string | null
          product_type?: string | null
        }
        Relationships: []
      }
      sales_data: {
        Row: SalesData
        Insert: {
          user_id: string
          period_start: string
          period_end: string
          tran_count: number
          vend_count: number
          amount: number
          two_tier_pricing?: number
          loyalty_discount?: number
          purchase_discount?: number
          free_product_discount?: number
          fingerprint: string
          upload_id?: string | null
          region_id?: string | null
          location_id?: string | null
          machine_id?: string | null
          product_type?: string | null
          payment_method?: string | null
          payment_category?: string | null
          campaign_name?: string | null
          raw_data?: Record<string, unknown> | null
        }
        Update: {
          period_start?: string
          period_end?: string
          tran_count?: number
          vend_count?: number
          amount?: number
          two_tier_pricing?: number
          loyalty_discount?: number
          purchase_discount?: number
          free_product_discount?: number
          fingerprint?: string
          upload_id?: string | null
          region_id?: string | null
          location_id?: string | null
          machine_id?: string | null
          product_type?: string | null
          payment_method?: string | null
          payment_category?: string | null
          campaign_name?: string | null
          raw_data?: Record<string, unknown> | null
        }
        Relationships: []
      }
      csv_uploads: {
        Row: CsvUpload
        Insert: {
          user_id: string
          filename: string
          platform: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          total_rows?: number
          imported_rows?: number
          duplicate_rows?: number
          period_start?: string | null
          period_end?: string | null
          mapping_id?: string | null
          error_message?: string | null
          completed_at?: string | null
        }
        Update: {
          filename?: string
          platform?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          total_rows?: number
          imported_rows?: number
          duplicate_rows?: number
          period_start?: string | null
          period_end?: string | null
          mapping_id?: string | null
          error_message?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      column_mappings: {
        Row: ColumnMapping
        Insert: {
          user_id: string
          mapping_name: string
          platform: string
          column_mappings: Record<string, string>
          is_default?: boolean
        }
        Update: {
          mapping_name?: string
          platform?: string
          column_mappings?: Record<string, string>
          is_default?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
