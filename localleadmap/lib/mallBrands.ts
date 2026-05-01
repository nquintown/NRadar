export const MALL_BRANDS = [
  'Westfield',
  'Klépierre',
  'Carmila',
  'Aushopping',
  'Ceetrus / Nhood',
  'Hammerson',
  'Mercialys',
  'E.Leclerc',
  'Carrefour',
  'Auchan',
  'Intermarché',
  'Système U',
  'Galeries Lafayette',
  'Printemps',
  'Altarea',
] as const

export type MallBrand = typeof MALL_BRANDS[number]

// Rules: OSM tag values → canonical brand name
const TAG_MAP: Record<string, MallBrand> = {
  // Westfield / URW
  'unibail-rodamco-westfield': 'Westfield',
  'unibail rodamco westfield': 'Westfield',
  'westfield': 'Westfield',

  // Klépierre
  'klépierre': 'Klépierre',
  'klepierre': 'Klépierre',
  'klépierre management': 'Klépierre',
  'klepierre management': 'Klépierre',

  // Carmila (filiale Carrefour pour les galeries)
  'carmila': 'Carmila',
  'carmila france': 'Carmila',

  // Aushopping / Auchan
  'aushopping': 'Aushopping',
  'auchan': 'Auchan',

  // Ceetrus / Nhood (ex-Immochan, groupe Mulliez)
  'ceetrus': 'Ceetrus / Nhood',
  'nhood': 'Ceetrus / Nhood',
  'immochan': 'Ceetrus / Nhood',

  // Hammerson
  'hammerson': 'Hammerson',

  // Mercialys (ex-Casino)
  'mercialys': 'Mercialys',

  // Leclerc
  'e. leclerc': 'E.Leclerc',
  'e.leclerc': 'E.Leclerc',
  'centre commercial e. leclerc': 'E.Leclerc',
  'centre commercial e.leclerc': 'E.Leclerc',

  // Carrefour
  'carrefour': 'Carrefour',

  // Intermarché
  'intermarché': 'Intermarché',
  'intermarche': 'Intermarché',
  'groupement des mousquetaires': 'Intermarché',

  // Système U
  'système u': 'Système U',
  'systeme u': 'Système U',
  'hyper u': 'Système U',

  // Galeries Lafayette
  'galeries lafayette': 'Galeries Lafayette',

  // Printemps
  'printemps': 'Printemps',

  // Altarea
  'altarea': 'Altarea',
  'altarea cogedim': 'Altarea',
}

// Name-based detection patterns (applied when no tag match)
const NAME_PATTERNS: Array<{ brand: MallBrand; re: RegExp }> = [
  { brand: 'Westfield',          re: /westfield/i },
  { brand: 'Klépierre',          re: /klepierre|klépierre/i },
  { brand: 'Carmila',            re: /carmila/i },
  { brand: 'Aushopping',         re: /aushopping/i },
  { brand: 'Ceetrus / Nhood',    re: /ceetrus|nhood|immochan/i },
  { brand: 'Hammerson',          re: /hammerson/i },
  { brand: 'Mercialys',          re: /mercialys/i },
  { brand: 'E.Leclerc',          re: /e\.?\s?leclerc/i },
  { brand: 'Carrefour',          re: /carrefour/i },
  { brand: 'Auchan',             re: /auchan/i },
  { brand: 'Intermarché',        re: /intermarch[eé]/i },
  { brand: 'Système U',          re: /syst[eè]me\s?u\b|super\s?u\b|hyper\s?u\b/i },
  { brand: 'Galeries Lafayette', re: /galeries?\s+lafayette/i },
  { brand: 'Printemps',          re: /\bprintemps\b/i },
  { brand: 'Altarea',            re: /altarea/i },
]

export function detectMallBrand(
  name: string,
  brand?: string,
  operator?: string
): MallBrand | undefined {
  // 1. OSM brand tag
  if (brand) {
    const match = TAG_MAP[brand.toLowerCase().trim()]
    if (match) return match
  }
  // 2. OSM operator tag
  if (operator) {
    const match = TAG_MAP[operator.toLowerCase().trim()]
    if (match) return match
  }
  // 3. Name-based detection
  for (const { brand: b, re } of NAME_PATTERNS) {
    if (re.test(name)) return b
  }
  return undefined
}
