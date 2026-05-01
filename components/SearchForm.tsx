'use client'

import { useState, FormEvent } from 'react'
import type { SearchCenter } from '@/types/pois'

interface Props {
  onResult: (center: SearchCenter) => void
  loading: boolean
}

export default function SearchForm({ onResult, loading }: Props) {
  const [address, setAddress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [geocoding, setGeocoding] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!address.trim()) return
    setError(null)
    setGeocoding(true)
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(address.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onResult(data)
      setAddress('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setGeocoding(false)
    }
  }

  const busy = geocoding || loading

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Adresse, code postal, ville…"
          disabled={busy}
          className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={busy || !address.trim()}
          className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
        >
          {geocoding ? (
            <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  )
}
