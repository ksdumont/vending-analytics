'use client'

import { PLATFORMS, type Platform } from '@/lib/utils/constants'

interface PlatformSelectorProps {
  value: Platform | null
  onChange: (platform: Platform) => void
  disabled?: boolean
}

export function PlatformSelector({ value, onChange, disabled }: PlatformSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.entries(PLATFORMS) as [Platform, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            disabled={disabled}
            className={`
              px-4 py-2 rounded-lg border text-sm font-medium transition-colors
              ${value === key
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
