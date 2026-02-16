'use client'

import { useRouter } from 'next/navigation'
import { BarChart3, Upload, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function OnboardingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">VendAnalytics</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
        <p className="text-gray-600 mb-8">
          Get started by uploading your first sales rollup CSV from Cantaloupe or another payment processor.
          We&apos;ll automatically detect the format and import your data.
        </p>

        <div className="space-y-4">
          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push('/upload')}
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Your First CSV
          </Button>

          <p className="text-xs text-gray-500">
            You can also skip this step and upload data later from the Upload page.
          </p>

          <button
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client')
              const supabase = createClient()
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                await supabase
                  .from('profiles')
                  .update({ onboarding_completed: true })
                  .eq('user_id', user.id)
              }
              router.push('/dashboard')
            }}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
          >
            Skip for now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  )
}
