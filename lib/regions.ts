export const REGIONS_FR = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d\'Azur',
] as const

export type RegionFR = typeof REGIONS_FR[number]

// Department number (2 chars) → region
const DEPT_TO_REGION: Record<string, RegionFR> = {
  '01': 'Auvergne-Rhône-Alpes',
  '02': 'Hauts-de-France',
  '03': 'Auvergne-Rhône-Alpes',
  '04': 'Provence-Alpes-Côte d\'Azur',
  '05': 'Provence-Alpes-Côte d\'Azur',
  '06': 'Provence-Alpes-Côte d\'Azur',
  '07': 'Auvergne-Rhône-Alpes',
  '08': 'Grand Est',
  '09': 'Occitanie',
  '10': 'Grand Est',
  '11': 'Occitanie',
  '12': 'Occitanie',
  '13': 'Provence-Alpes-Côte d\'Azur',
  '14': 'Normandie',
  '15': 'Auvergne-Rhône-Alpes',
  '16': 'Nouvelle-Aquitaine',
  '17': 'Nouvelle-Aquitaine',
  '18': 'Centre-Val de Loire',
  '19': 'Nouvelle-Aquitaine',
  '20': 'Corse',
  '21': 'Bourgogne-Franche-Comté',
  '22': 'Bretagne',
  '23': 'Nouvelle-Aquitaine',
  '24': 'Nouvelle-Aquitaine',
  '25': 'Bourgogne-Franche-Comté',
  '26': 'Auvergne-Rhône-Alpes',
  '27': 'Normandie',
  '28': 'Centre-Val de Loire',
  '29': 'Bretagne',
  '30': 'Occitanie',
  '31': 'Occitanie',
  '32': 'Occitanie',
  '33': 'Nouvelle-Aquitaine',
  '34': 'Occitanie',
  '35': 'Bretagne',
  '36': 'Centre-Val de Loire',
  '37': 'Centre-Val de Loire',
  '38': 'Auvergne-Rhône-Alpes',
  '39': 'Bourgogne-Franche-Comté',
  '40': 'Nouvelle-Aquitaine',
  '41': 'Centre-Val de Loire',
  '42': 'Auvergne-Rhône-Alpes',
  '43': 'Auvergne-Rhône-Alpes',
  '44': 'Pays de la Loire',
  '45': 'Centre-Val de Loire',
  '46': 'Occitanie',
  '47': 'Nouvelle-Aquitaine',
  '48': 'Occitanie',
  '49': 'Pays de la Loire',
  '50': 'Normandie',
  '51': 'Grand Est',
  '52': 'Grand Est',
  '53': 'Pays de la Loire',
  '54': 'Grand Est',
  '55': 'Grand Est',
  '56': 'Bretagne',
  '57': 'Grand Est',
  '58': 'Bourgogne-Franche-Comté',
  '59': 'Hauts-de-France',
  '60': 'Hauts-de-France',
  '61': 'Normandie',
  '62': 'Hauts-de-France',
  '63': 'Auvergne-Rhône-Alpes',
  '64': 'Nouvelle-Aquitaine',
  '65': 'Occitanie',
  '66': 'Occitanie',
  '67': 'Grand Est',
  '68': 'Grand Est',
  '69': 'Auvergne-Rhône-Alpes',
  '70': 'Bourgogne-Franche-Comté',
  '71': 'Bourgogne-Franche-Comté',
  '72': 'Pays de la Loire',
  '73': 'Auvergne-Rhône-Alpes',
  '74': 'Auvergne-Rhône-Alpes',
  '75': 'Île-de-France',
  '76': 'Normandie',
  '77': 'Île-de-France',
  '78': 'Île-de-France',
  '79': 'Nouvelle-Aquitaine',
  '80': 'Hauts-de-France',
  '81': 'Occitanie',
  '82': 'Occitanie',
  '83': 'Provence-Alpes-Côte d\'Azur',
  '84': 'Provence-Alpes-Côte d\'Azur',
  '85': 'Pays de la Loire',
  '86': 'Nouvelle-Aquitaine',
  '87': 'Nouvelle-Aquitaine',
  '88': 'Grand Est',
  '89': 'Bourgogne-Franche-Comté',
  '90': 'Bourgogne-Franche-Comté',
  '91': 'Île-de-France',
  '92': 'Île-de-France',
  '93': 'Île-de-France',
  '94': 'Île-de-France',
  '95': 'Île-de-France',
}

// Region centroids for lat/lon fallback (approximate geographic center)
const REGION_CENTROIDS: Array<{ name: RegionFR; lat: number; lon: number }> = [
  { name: 'Île-de-France',               lat: 48.65, lon: 2.40 },
  { name: 'Hauts-de-France',             lat: 50.20, lon: 2.70 },
  { name: 'Grand Est',                   lat: 48.60, lon: 6.50 },
  { name: 'Normandie',                   lat: 49.00, lon: 0.40 },
  { name: 'Bretagne',                    lat: 48.10, lon: -2.90 },
  { name: 'Pays de la Loire',            lat: 47.40, lon: -0.90 },
  { name: 'Centre-Val de Loire',         lat: 47.50, lon: 1.90 },
  { name: 'Bourgogne-Franche-Comté',    lat: 47.10, lon: 5.00 },
  { name: 'Auvergne-Rhône-Alpes',       lat: 45.50, lon: 4.60 },
  { name: 'Nouvelle-Aquitaine',          lat: 44.80, lon: 0.20 },
  { name: 'Occitanie',                   lat: 43.80, lon: 2.10 },
  { name: 'Provence-Alpes-Côte d\'Azur', lat: 43.80, lon: 5.90 },
  { name: 'Corse',                       lat: 42.10, lon: 9.10 },
]

export function getRegionFromPostcode(postcode: string): RegionFR | undefined {
  if (!postcode) return undefined
  const clean = postcode.trim().replace(/\s/g, '')
  if (clean.length < 2) return undefined
  // Handle Corse: 2A/2B codes or 20xxx
  if (/^2[AB]/i.test(clean)) return 'Corse'
  return DEPT_TO_REGION[clean.slice(0, 2)]
}

// Nearest-centroid fallback — never returns undefined
export function getRegionFromLatLon(lat: number, lon: number): RegionFR {
  let best = REGION_CENTROIDS[0]
  let bestDist = Infinity
  for (const c of REGION_CENTROIDS) {
    const d = (lat - c.lat) ** 2 + (lon - c.lon) ** 2
    if (d < bestDist) { bestDist = d; best = c }
  }
  return best.name
}

export function resolveRegion(postcode: string | undefined, lat: number, lon: number): RegionFR {
  return getRegionFromPostcode(postcode ?? '') ?? getRegionFromLatLon(lat, lon)
}
