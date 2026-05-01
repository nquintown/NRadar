'use client'

import { useState } from 'react'
import { CATEGORIES, CATEGORY_GROUPS } from '@/lib/osmCategories'

interface Props {
  selected: string[]
  onChange: (selected: string[]) => void
}

export default function CategorySelector({ selected, onChange }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const selectedSet = new Set(selected)

  function toggleCategory(key: string) {
    const next = new Set(selectedSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(Array.from(next))
  }

  function toggleGroup(keys: string[]) {
    const allIn = keys.every(k => selectedSet.has(k))
    const next = new Set(selectedSet)
    if (allIn) keys.forEach(k => next.delete(k))
    else keys.forEach(k => next.add(k))
    onChange(Array.from(next))
  }

  const allKeys = CATEGORIES.map(c => c.key)
  const allSelected = allKeys.every(k => selectedSet.has(k))

  return (
    <div className="flex flex-col gap-1.5">
      {CATEGORY_GROUPS.map(group => {
        const groupCats = group.categoryKeys
          .map(k => CATEGORIES.find(c => c.key === k))
          .filter(Boolean) as typeof CATEGORIES
        const selectedCount = groupCats.filter(c => selectedSet.has(c.key)).length
        const allIn = selectedCount === groupCats.length
        const someIn = selectedCount > 0 && selectedCount < groupCats.length
        const isExpanded = expanded === group.key

        return (
          <div key={group.key}>
            <div className={`flex items-center gap-1 rounded-lg border transition-all ${
              allIn ? 'bg-gray-900 border-gray-900 text-white'
              : someIn ? 'bg-gray-100 border-gray-300 text-gray-700'
              : 'bg-white border-gray-200 text-gray-500'
            }`}>
              {/* Toggle selection */}
              <button
                type="button"
                onClick={() => toggleGroup(group.categoryKeys)}
                className="flex items-center gap-2 flex-1 px-2.5 py-1.5 text-xs font-semibold text-left"
              >
                <span className="text-sm leading-none">{group.emoji}</span>
                <span className="flex-1">{group.label}</span>
                <span className="text-[10px] font-medium tabular-nums opacity-60">
                  {selectedCount}/{groupCats.length}
                </span>
              </button>

              {/* Expand toggle */}
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : group.key)}
                className={`px-2 py-1.5 border-l transition-colors ${
                  allIn ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'
                }`}
                aria-label="Voir les sous-catégories"
              >
                <svg
                  className={`h-3 w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Subcategory pills — shown only when expanded */}
            {isExpanded && (
              <div className="flex flex-wrap gap-1 pl-1 pt-1.5 pb-1">
                {groupCats.map(cat => {
                  const active = selectedSet.has(cat.key)
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => toggleCategory(cat.key)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-all ${
                        active
                          ? 'bg-gray-800 text-white border-gray-800'
                          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700'
                      }`}
                    >
                      <span className="text-[12px] leading-none">{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => onChange(allSelected ? [] : allKeys)}
        className="self-start text-[11px] text-gray-400 hover:text-gray-700 transition-colors mt-1"
      >
        {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
      </button>

      {selected.length === 0 && (
        <p className="text-xs text-red-400">Sélectionnez au moins une catégorie</p>
      )}
    </div>
  )
}
