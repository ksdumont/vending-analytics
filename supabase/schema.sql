-- VendAnalytics Database Schema (Food & Drink Vending)
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables first (CASCADE handles triggers, policies, indexes)
DROP TABLE IF EXISTS equipment_assignments CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS sales_data CASCADE;
DROP TABLE IF EXISTS sync_reports CASCADE;
DROP TABLE IF EXISTS csv_uploads CASCADE;
DROP TABLE IF EXISTS data_mappings CASCADE;
DROP TABLE IF EXISTS column_mappings CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS machines CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS regions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop trigger on auth.users (not covered by CASCADE above)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();

-- ============================================
-- CREATE TABLES
-- ============================================

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT,
  company_name TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Regions table (normalized geographic territories)
CREATE TABLE regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, normalized_name)
);

-- Locations table
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  location_type TEXT,
  city TEXT,
  state TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, normalized_name)
);

-- Machines table
CREATE TABLE machines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  serial_number TEXT NOT NULL,
  asset_number TEXT,
  make TEXT,
  model TEXT,
  product_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, serial_number)
);

-- Column mappings table (must be before csv_uploads which references it)
CREATE TABLE column_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mapping_name TEXT NOT NULL,
  platform TEXT DEFAULT 'custom',
  column_mappings JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CSV uploads table (must be before sales_data which references it)
CREATE TABLE csv_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  platform TEXT DEFAULT 'cantaloupe',
  period_start DATE,
  period_end DATE,
  mapping_id UUID REFERENCES column_mappings(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_rows INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  duplicate_rows INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Sales data table (aggregated records from CSV imports)
CREATE TABLE sales_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES csv_uploads(id) ON DELETE SET NULL,
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  product_type TEXT,
  payment_method TEXT,
  payment_category TEXT,
  tran_count INTEGER NOT NULL DEFAULT 0,
  vend_count INTEGER NOT NULL DEFAULT 0,
  amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  two_tier_pricing DECIMAL(10, 2) DEFAULT 0,
  loyalty_discount DECIMAL(10, 2) DEFAULT 0,
  campaign_name TEXT,
  purchase_discount DECIMAL(10, 2) DEFAULT 0,
  free_product_discount DECIMAL(10, 2) DEFAULT 0,
  fingerprint TEXT NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATE INDEXES
-- ============================================

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_regions_user_id ON regions(user_id);
CREATE INDEX idx_regions_normalized ON regions(user_id, normalized_name);
CREATE INDEX idx_locations_user_id ON locations(user_id);
CREATE INDEX idx_locations_region_id ON locations(region_id);
CREATE INDEX idx_locations_normalized ON locations(user_id, normalized_name);
CREATE INDEX idx_machines_user_id ON machines(user_id);
CREATE INDEX idx_machines_location_id ON machines(location_id);
CREATE INDEX idx_machines_serial ON machines(user_id, serial_number);
CREATE INDEX idx_sales_data_user_id ON sales_data(user_id);
CREATE INDEX idx_sales_data_upload_id ON sales_data(upload_id);
CREATE INDEX idx_sales_data_location_id ON sales_data(location_id);
CREATE INDEX idx_sales_data_machine_id ON sales_data(machine_id);
CREATE INDEX idx_sales_data_region_id ON sales_data(region_id);
CREATE INDEX idx_sales_data_period ON sales_data(period_start, period_end);
CREATE INDEX idx_sales_data_fingerprint ON sales_data(fingerprint);
CREATE INDEX idx_csv_uploads_user_id ON csv_uploads(user_id);
CREATE INDEX idx_column_mappings_user_id ON column_mappings(user_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE column_mappings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = user_id);

-- Regions policies
CREATE POLICY "Users can view own regions" ON regions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own regions" ON regions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own regions" ON regions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own regions" ON regions FOR DELETE USING (auth.uid() = user_id);

-- Locations policies
CREATE POLICY "Users can view own locations" ON locations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own locations" ON locations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own locations" ON locations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own locations" ON locations FOR DELETE USING (auth.uid() = user_id);

-- Machines policies
CREATE POLICY "Users can view own machines" ON machines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own machines" ON machines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own machines" ON machines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own machines" ON machines FOR DELETE USING (auth.uid() = user_id);

-- Sales data policies
CREATE POLICY "Users can view own sales data" ON sales_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sales data" ON sales_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sales data" ON sales_data FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sales data" ON sales_data FOR DELETE USING (auth.uid() = user_id);

-- CSV uploads policies
CREATE POLICY "Users can view own csv uploads" ON csv_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own csv uploads" ON csv_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own csv uploads" ON csv_uploads FOR UPDATE USING (auth.uid() = user_id);

-- Column mappings policies
CREATE POLICY "Users can view own column mappings" ON column_mappings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own column mappings" ON column_mappings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own column mappings" ON column_mappings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own column mappings" ON column_mappings FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CREATE FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to automatically create profile on signup
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_regions_updated_at BEFORE UPDATE ON regions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_column_mappings_updated_at BEFORE UPDATE ON column_mappings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CREATE PROFILE FOR EXISTING USERS
-- ============================================

INSERT INTO profiles (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM profiles);
