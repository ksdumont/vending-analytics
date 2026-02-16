'use client'

import { Lightbulb } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

interface InsightsPanelProps {
  insights: string[]
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  if (insights.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <CardTitle>Insights</CardTitle>
        </div>
      </CardHeader>
      <ul className="space-y-2">
        {insights.map((insight, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-blue-500 mt-0.5">&#8226;</span>
            {insight}
          </li>
        ))}
      </ul>
    </Card>
  )
}
