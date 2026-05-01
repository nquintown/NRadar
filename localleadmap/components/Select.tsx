'use client'

import { useId } from 'react'

interface Option {
  value: string | number
  label: string
}

interface Props {
  value: string | number
  onChange: (value: string) => void
  options: Option[]
  className?: string
}

export default function Select({ value, onChange, options, className = '' }: Props) {
  const id = useId()
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-full bg-white border border-gray-200 rounded-xl text-sm text-gray-700 font-medium pl-3 pr-8 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent cursor-pointer hover:border-gray-300 transition-colors"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 flex-shrink-0"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}
