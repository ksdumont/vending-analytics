'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/useAuth'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  User,
  Download,
  Check,
} from 'lucide-react'

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState('profile')

  // Profile settings
  const [businessName, setBusinessName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [timezone, setTimezone] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Export
  const [exportLoading, setExportLoading] = useState(false)
  const [exportStartDate, setExportStartDate] = useState('')
  const [exportEndDate, setExportEndDate] = useState('')

  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || '')
      setCompanyName(profile.company_name || '')
      setTimezone(profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
    }
  }, [profile])

  const handleSaveProfile = async () => {
    if (!user) return
    setProfileLoading(true)
    setProfileSuccess(false)

    try {
      await supabase
        .from('profiles')
        .update({
          business_name: businessName || null,
          company_name: companyName || null,
          timezone
        })
        .eq('user_id', user.id)

      await refreshProfile()
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleExport = async () => {
    if (!user) return
    setExportLoading(true)

    try {
      let query = supabase
        .from('sales_data')
        .select('*')
        .eq('user_id', user.id)
        .order('period_start', { ascending: false })

      if (exportStartDate) {
        query = query.gte('period_start', exportStartDate)
      }
      if (exportEndDate) {
        query = query.lte('period_end', exportEndDate)
      }

      const { data } = await query

      if (data && data.length > 0) {
        const headers = ['Period Start', 'Period End', 'Product Type', 'Payment Method', 'Payment Category', 'Tran Count', 'Vend Count', 'Amount', 'Two-Tier Pricing', 'Loyalty Discount', 'Purchase Discount', 'Free Product Discount']
        const rows = data.map(s => [
          s.period_start,
          s.period_end,
          s.product_type || '',
          s.payment_method || '',
          s.payment_category || '',
          s.tran_count,
          s.vend_count,
          s.amount,
          s.two_tier_pricing,
          s.loyalty_discount,
          s.purchase_discount,
          s.free_product_discount,
        ])

        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vending-export-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting data:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'export', label: 'Export Data', icon: Download },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account settings</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-colors
                  ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your business information</CardDescription>
          </CardHeader>

          <div className="space-y-4 mt-4">
            <Input
              id="business-name"
              label="Business Name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="My Vending Business"
            />

            <Input
              id="company-name"
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="FCV Snacks and Bev LLC"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="America/Phoenix">Arizona Time</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={handleSaveProfile} loading={profileLoading}>
                Save Changes
              </Button>
              {profileSuccess && (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <Check className="w-4 h-4" />
                  Saved successfully
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Download your sales data as CSV</CardDescription>
          </CardHeader>

          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="date"
                label="Start Date (optional)"
                value={exportStartDate}
                onChange={(e) => setExportStartDate(e.target.value)}
              />
              <Input
                type="date"
                label="End Date (optional)"
                value={exportEndDate}
                onChange={(e) => setExportEndDate(e.target.value)}
              />
            </div>

            <Button onClick={handleExport} loading={exportLoading}>
              <Download className="w-4 h-4 mr-2" />
              Export to CSV
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
