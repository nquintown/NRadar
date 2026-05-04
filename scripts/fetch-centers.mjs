#!/usr/bin/env node
/**
 * Prebuild script: fetches French shopping centers from Overpass API
 * and writes public/shopping-centers.json for static serving.
 * If Overpass is unavailable and a cached file exists, it is kept as-is.
 */

import { writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'shopping-centers.json')

const ENDPOINTS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

const QUERY = `[out:json][timeout:90];
area["ISO3166-1"="FR"]["admin_level"="2"]->.fr;
(
  way["shop"="mall"](area.fr);
  way["building"="mall"](area.fr);
  way["shop"="department_store"]["name"~".",i](area.fr);
  node["shop"="mall"](area.fr);
  node["building"="mall"](area.fr);
);
out center tags;`

const META_FR = { latMin: 41.3, latMax: 51.2, lonMin: -5.2, lonMax: 9.7 }

function inFrance(lat, lon) {
  return lat >= META_FR.latMin && lat <= META_FR.latMax &&
         lon >= META_FR.lonMin && lon <= META_FR.lonMax
}

async function tryFetch(endpoint) {
  const url = `${endpoint}?data=${encodeURIComponent(QUERY)}`
  console.log(`  → ${endpoint}`)
  const res = await fetch(url, {
    headers: { 'User-Agent': 'NRadar-build/1.0' },
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json.elements)) throw new Error('Invalid Overpass response')
  return json.elements
}

function resolveRegion(postcode) {
  if (!postcode) return undefined
  const dept = postcode.slice(0, 2)
  const map = {
    '01':'Auvergne-Rhône-Alpes','03':'Auvergne-Rhône-Alpes','07':'Auvergne-Rhône-Alpes',
    '15':'Auvergne-Rhône-Alpes','26':'Auvergne-Rhône-Alpes','38':'Auvergne-Rhône-Alpes',
    '42':'Auvergne-Rhône-Alpes','43':'Auvergne-Rhône-Alpes','63':'Auvergne-Rhône-Alpes',
    '69':'Auvergne-Rhône-Alpes','73':'Auvergne-Rhône-Alpes','74':'Auvergne-Rhône-Alpes',
    '21':'Bourgogne-Franche-Comté','25':'Bourgogne-Franche-Comté','39':'Bourgogne-Franche-Comté',
    '58':'Bourgogne-Franche-Comté','70':'Bourgogne-Franche-Comté','71':'Bourgogne-Franche-Comté',
    '89':'Bourgogne-Franche-Comté','90':'Bourgogne-Franche-Comté',
    '22':'Bretagne','29':'Bretagne','35':'Bretagne','56':'Bretagne',
    '18':'Centre-Val de Loire','28':'Centre-Val de Loire','36':'Centre-Val de Loire',
    '37':'Centre-Val de Loire','41':'Centre-Val de Loire','45':'Centre-Val de Loire',
    '2A':'Corse','2B':'Corse',
    '08':'Grand Est','10':'Grand Est','51':'Grand Est','52':'Grand Est',
    '54':'Grand Est','55':'Grand Est','57':'Grand Est','67':'Grand Est',
    '68':'Grand Est','88':'Grand Est',
    '02':'Hauts-de-France','59':'Hauts-de-France','60':'Hauts-de-France',
    '62':'Hauts-de-France','80':'Hauts-de-France',
    '75':'Île-de-France','77':'Île-de-France','78':'Île-de-France','91':'Île-de-France',
    '92':'Île-de-France','93':'Île-de-France','94':'Île-de-France','95':'Île-de-France',
    '14':'Normandie','27':'Normandie','50':'Normandie','61':'Normandie','76':'Normandie',
    '16':'Nouvelle-Aquitaine','17':'Nouvelle-Aquitaine','19':'Nouvelle-Aquitaine',
    '23':'Nouvelle-Aquitaine','24':'Nouvelle-Aquitaine','33':'Nouvelle-Aquitaine',
    '40':'Nouvelle-Aquitaine','47':'Nouvelle-Aquitaine','64':'Nouvelle-Aquitaine',
    '79':'Nouvelle-Aquitaine','86':'Nouvelle-Aquitaine','87':'Nouvelle-Aquitaine',
    '09':'Occitanie','11':'Occitanie','12':'Occitanie','30':'Occitanie','31':'Occitanie',
    '32':'Occitanie','34':'Occitanie','46':'Occitanie','48':'Occitanie','65':'Occitanie',
    '66':'Occitanie','81':'Occitanie','82':'Occitanie',
    '44':'Pays de la Loire','49':'Pays de la Loire','53':'Pays de la Loire',
    '72':'Pays de la Loire','85':'Pays de la Loire',
    '04':"Provence-Alpes-Côte d'Azur",'05':"Provence-Alpes-Côte d'Azur",
    '06':"Provence-Alpes-Côte d'Azur",'13':"Provence-Alpes-Côte d'Azur",
    '83':"Provence-Alpes-Côte d'Azur",'84':"Provence-Alpes-Côte d'Azur",
  }
  return map[dept]
}

async function main() {
  console.log('Fetching shopping centers from Overpass…')
  let elements = null

  for (const endpoint of ENDPOINTS) {
    try {
      elements = await tryFetch(endpoint)
      console.log(`  ✓ Got ${elements.length} elements`)
      break
    } catch (err) {
      console.warn(`  ✗ ${err.message}`)
    }
  }

  if (!elements) {
    if (existsSync(OUT)) {
      console.log('Overpass unavailable — keeping existing shopping-centers.json')
      process.exit(0)
    }
    console.error('Overpass unavailable and no cached file exists — writing empty array')
    writeFileSync(OUT, '[]')
    process.exit(0)
  }

  const seen = new Set()
  const centers = []

  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat
    const lon = el.lon ?? el.center?.lon
    const name = el.tags?.name
    if (lat === undefined || lon === undefined || !name) continue
    if (!inFrance(lat, lon)) continue

    const key = `${name.toLowerCase().replace(/\s+/g, '')}-${Math.round(lat * 100)}-${Math.round(lon * 100)}`
    if (seen.has(key)) continue
    seen.add(key)

    const t = el.tags ?? {}
    const street = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ')

    centers.push({
      id: `${el.type}/${el.id}`,
      name,
      lat,
      lon,
      city: t['addr:city'],
      postcode: t['addr:postcode'],
      address: street || undefined,
      brand: t.brand,
      operator: t.operator,
      website: t.website || t['contact:website'],
      openingHours: t.opening_hours,
      region: resolveRegion(t['addr:postcode']),
    })
  }

  centers.sort((a, b) => (a.city ?? '').localeCompare(b.city ?? '', 'fr'))
  writeFileSync(OUT, JSON.stringify(centers))
  console.log(`✓ Wrote ${centers.length} centers to public/shopping-centers.json`)
}

main()
