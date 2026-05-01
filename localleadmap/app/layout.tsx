import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NilsRadar — Géolocalisation de leads B2B',
  description:
    'Géolocalisez les commerces et professionnels près de vos centres commerciaux. Export CSV instantané.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          crossOrigin=""
        />
      </head>
      <body className="h-full bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  )
}
