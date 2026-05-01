export default function LegalNotice() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
      <svg className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd" />
      </svg>
      <p>
        Les données affichées sont issues d&apos;OpenStreetMap et de sources ouvertes. Elles peuvent être
        incomplètes ou inexactes. En utilisant ces données à des fins commerciales ou de prospection,
        vous êtes tenu de respecter les licences ODbL d&apos;OpenStreetMap, le{' '}
        <strong>RGPD</strong> et les règles applicables à la <strong>prospection B2B</strong>{' '}
        (opt-out, intérêt légitime, etc.). NilsRadar ne stocke aucune donnée et décline toute
        responsabilité quant à l&apos;usage fait des informations exportées.
      </p>
    </div>
  )
}
