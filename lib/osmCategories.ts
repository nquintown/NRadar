export interface CategoryDef {
  key: string
  label: string
  emoji: string
  overpassFilters: string[]
}

export const CATEGORIES: CategoryDef[] = [
  // Alimentation
  {
    key: 'bakery',
    label: 'Boulangerie / Pâtisserie',
    emoji: '🥖',
    overpassFilters: ['["shop"="bakery"]', '["shop"="pastry"]'],
  },
  {
    key: 'butcher',
    label: 'Boucherie / Traiteur',
    emoji: '🥩',
    overpassFilters: ['["shop"="butcher"]', '["shop"="deli"]'],
  },
  {
    key: 'grocery',
    label: 'Épicerie / Alimentation',
    emoji: '🛒',
    overpassFilters: [
      '["shop"="convenience"]',
      '["shop"="grocery"]',
      '["shop"="greengrocer"]',
      '["shop"="supermarket"]',
      '["shop"="wine"]',
      '["shop"="cheese"]',
    ],
  },
  // Restauration
  {
    key: 'restaurant',
    label: 'Restaurant',
    emoji: '🍽️',
    overpassFilters: ['["amenity"="restaurant"]'],
  },
  {
    key: 'fast_food',
    label: 'Fast-food / Snack',
    emoji: '🍔',
    overpassFilters: ['["amenity"="fast_food"]'],
  },
  {
    key: 'cafe',
    label: 'Café / Bar',
    emoji: '☕',
    overpassFilters: ['["amenity"="cafe"]', '["amenity"="bar"]', '["amenity"="pub"]'],
  },
  // Santé & Beauté
  {
    key: 'pharmacy',
    label: 'Pharmacie',
    emoji: '💊',
    overpassFilters: ['["amenity"="pharmacy"]'],
  },
  {
    key: 'health',
    label: 'Médecin / Santé',
    emoji: '🏥',
    overpassFilters: [
      '["amenity"="doctors"]',
      '["amenity"="dentist"]',
      '["amenity"="clinic"]',
      '["healthcare"~"doctor|physiotherapist|nurse|psychotherapist|optometrist"]',
    ],
  },
  {
    key: 'hairdresser',
    label: 'Coiffeur',
    emoji: '✂️',
    overpassFilters: ['["shop"="hairdresser"]'],
  },
  {
    key: 'beauty',
    label: 'Beauté / Esthétique',
    emoji: '💅',
    overpassFilters: ['["shop"="beauty"]', '["shop"="cosmetics"]', '["shop"="perfumery"]'],
  },
  {
    key: 'optician',
    label: 'Opticien',
    emoji: '👓',
    overpassFilters: ['["shop"="optician"]'],
  },
  {
    key: 'tattoo',
    label: 'Tatouage / Piercing',
    emoji: '🖋️',
    overpassFilters: ['["shop"="tattoo"]'],
  },
  {
    key: 'fitness',
    label: 'Salle de sport / Fitness',
    emoji: '🏋️',
    overpassFilters: [
      '["leisure"="fitness_centre"]',
      '["leisure"="sports_centre"]',
      '["shop"="sports"]',
    ],
  },
  // Mode & Retail
  {
    key: 'clothes',
    label: 'Mode / Vêtements',
    emoji: '👗',
    overpassFilters: ['["shop"="clothes"]', '["shop"="shoes"]', '["shop"="bags"]', '["shop"="accessories"]'],
  },
  {
    key: 'jewelry',
    label: 'Bijouterie / Horlogerie',
    emoji: '💍',
    overpassFilters: ['["shop"="jewelry"]', '["shop"="watches"]'],
  },
  {
    key: 'electronics',
    label: 'High-tech / Téléphonie',
    emoji: '📱',
    overpassFilters: ['["shop"="electronics"]', '["shop"="mobile_phone"]', '["shop"="computer"]'],
  },
  {
    key: 'furniture',
    label: 'Maison / Décoration',
    emoji: '🛋️',
    overpassFilters: ['["shop"="furniture"]', '["shop"="interior_decoration"]', '["shop"="houseware"]', '["shop"="bed"]'],
  },
  {
    key: 'books',
    label: 'Librairie / Papeterie',
    emoji: '📚',
    overpassFilters: ['["shop"="books"]', '["shop"="stationery"]'],
  },
  {
    key: 'toys',
    label: 'Jouets / Jeux',
    emoji: '🧸',
    overpassFilters: ['["shop"="toys"]', '["shop"="games"]'],
  },
  {
    key: 'pet',
    label: 'Animalerie',
    emoji: '🐾',
    overpassFilters: ['["shop"="pet"]'],
  },
  {
    key: 'florist',
    label: 'Fleuriste',
    emoji: '💐',
    overpassFilters: ['["shop"="florist"]'],
  },
  {
    key: 'tobacco',
    label: 'Tabac / Presse',
    emoji: '🗞️',
    overpassFilters: ['["shop"="tobacco"]', '["shop"="newsagent"]'],
  },
  // Services
  {
    key: 'craft',
    label: 'Artisan',
    emoji: '🔧',
    overpassFilters: ['["craft"~"."]'],
  },
  {
    key: 'garage',
    label: 'Garage / Auto',
    emoji: '🚗',
    overpassFilters: ['["shop"="car_repair"]', '["shop"="car"]', '["shop"="car_parts"]'],
  },
  {
    key: 'laundry',
    label: 'Pressing / Laverie',
    emoji: '👔',
    overpassFilters: ['["shop"="dry_cleaning"]', '["amenity"="laundry"]'],
  },
  {
    key: 'travel',
    label: 'Agence de voyage',
    emoji: '✈️',
    overpassFilters: ['["shop"="travel_agency"]'],
  },
  // Finance & Pro
  {
    key: 'bank',
    label: 'Banque / Finance',
    emoji: '🏦',
    overpassFilters: ['["amenity"="bank"]', '["amenity"="bureau_de_change"]'],
  },
  {
    key: 'insurance',
    label: 'Assurance',
    emoji: '🛡️',
    overpassFilters: ['["office"="insurance"]'],
  },
  {
    key: 'real_estate',
    label: 'Immobilier',
    emoji: '🏠',
    overpassFilters: ['["office"="estate_agent"]'],
  },
  {
    key: 'legal',
    label: 'Notaire / Avocat / Comptable',
    emoji: '⚖️',
    overpassFilters: ['["office"="notary"]', '["office"="lawyer"]', '["office"="accountant"]', '["office"="tax_advisor"]'],
  },
  // Loisirs & Hébergement
  {
    key: 'hotel',
    label: 'Hôtel / Hébergement',
    emoji: '🏨',
    overpassFilters: ['["tourism"="hotel"]', '["tourism"="hostel"]', '["tourism"="guest_house"]'],
  },
  {
    key: 'cinema',
    label: 'Cinéma / Loisirs',
    emoji: '🎬',
    overpassFilters: ['["amenity"="cinema"]', '["amenity"="theatre"]', '["leisure"="escape_game"]'],
  },
]

export interface CategoryGroup {
  key: string
  label: string
  emoji: string
  categoryKeys: string[]
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    key: 'food',
    label: 'Alimentation',
    emoji: '🥗',
    categoryKeys: ['bakery', 'butcher', 'grocery'],
  },
  {
    key: 'restaurant',
    label: 'Restauration',
    emoji: '🍽️',
    categoryKeys: ['restaurant', 'fast_food', 'cafe'],
  },
  {
    key: 'health_beauty',
    label: 'Santé & Beauté',
    emoji: '💊',
    categoryKeys: ['pharmacy', 'health', 'hairdresser', 'beauty', 'optician', 'tattoo', 'fitness'],
  },
  {
    key: 'retail',
    label: 'Mode & Commerce',
    emoji: '🛍️',
    categoryKeys: ['clothes', 'jewelry', 'electronics', 'furniture', 'books', 'toys', 'pet', 'florist', 'tobacco'],
  },
  {
    key: 'services',
    label: 'Services',
    emoji: '🔧',
    categoryKeys: ['craft', 'garage', 'laundry', 'travel'],
  },
  {
    key: 'finance',
    label: 'Finance & Pro',
    emoji: '🏦',
    categoryKeys: ['bank', 'insurance', 'real_estate', 'legal'],
  },
  {
    key: 'leisure',
    label: 'Loisirs',
    emoji: '🎭',
    categoryKeys: ['hotel', 'cinema'],
  },
]

export const CATEGORY_MAP = new Map(CATEGORIES.map(c => [c.key, c]))

export function getCategoryLabel(key: string): string {
  return CATEGORY_MAP.get(key)?.label ?? key
}
