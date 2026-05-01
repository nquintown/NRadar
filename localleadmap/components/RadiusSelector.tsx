'use client'

interface Props {
  value: number
  onChange: (radius: number) => void
}

const OPTIONS = [
  { label: '500 m', value: 500 },
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
]

export default function RadiusSelector({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
            value === opt.value
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
