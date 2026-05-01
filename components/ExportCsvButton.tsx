'use client'

import type { POI } from '@/types/pois'
import { downloadCsv } from '@/lib/exportCsv'

interface Props {
  pois: POI[]
  label?: string
}

export default function ExportCsvButton({ pois, label = 'Exporter CSV' }: Props) {
  if (!pois.length) return null

  function handleExport() {
    const date = new Date().toISOString().slice(0, 10)
    downloadCsv(pois, `localleadmap-${date}.csv`)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      {label} ({pois.length})
    </button>
  )
}
