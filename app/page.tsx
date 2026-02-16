import Link from 'next/link'
import {
  BarChart3,
  ArrowRight,
  LineChart,
  Upload,
  Shield,
  Zap,
  CreditCard,
  MapPin
} from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">VendAnalytics</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
              Turn Your Vending Data Into
              <span className="text-blue-600"> Actionable Insights</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
              The analytics platform built for food &amp; drink vending machine operators.
              Upload your Cantaloupe CSV, see revenue by region, track payment trends,
              and make data-driven decisions to grow your business.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Three Steps to Better Vending Analytics
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Upload className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Upload CSV</h3>
              <p className="text-gray-600">
                Drop in your sales rollup from Cantaloupe, Nayax, or any payment processor.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LineChart className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. See Analytics</h3>
              <p className="text-gray-600">
                Instant dashboards with revenue by region, payment trends, and machine performance.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Grow Revenue</h3>
              <p className="text-gray-600">
                Identify top locations, optimize payment methods, and spot underperforming machines.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Everything You Need to Manage Your Vending Business
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Built specifically for food &amp; drink vending operators who use Cantaloupe and similar platforms.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <LineChart className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Revenue Analytics</h3>
              <p className="text-gray-600">
                Track revenue by region, location, and machine with interactive charts and sortable tables.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Payment Insights</h3>
              <p className="text-gray-600">
                See how cash, credit, Apple Pay, Google Pay, and contactless payments break down across your fleet.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Location Management</h3>
              <p className="text-gray-600">
                Region-grouped locations with drill-down into machines, revenue, and performance metrics.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart CSV Import</h3>
              <p className="text-gray-600">
                Auto-detects Cantaloupe format, maps all 21 columns, extracts date ranges from filenames.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Duplicate Prevention</h3>
              <p className="text-gray-600">
                Fingerprint-based dedup means you can re-upload the same file without double-counting.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto-Generated Insights</h3>
              <p className="text-gray-600">
                Discover top regions, payment trends, zero-revenue machines, and best-performing location types.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Grow Your Vending Business?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join operators who use VendAnalytics to make smarter, data-driven decisions.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <span className="font-semibold text-gray-900">VendAnalytics</span>
            </div>
            <p className="text-gray-500 text-sm">
              &copy; {new Date().getFullYear()} VendAnalytics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
