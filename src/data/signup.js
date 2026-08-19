import { transliterateTamil } from '../lib/tamilTransliteration.js'
import tamilNaduHierarchy from './tamilNaduHierarchy.json'

const tamilCollator = new Intl.Collator('ta-IN', {
  numeric: true,
  sensitivity: 'base',
})

function sortByTamilName(items) {
  return [...items].sort((first, second) => tamilCollator.compare(first.name, second.name))
}

function sortHierarchyByTamilName(hierarchy) {
  return {
    ...hierarchy,
    districts: sortByTamilName(hierarchy.districts).map((district) => ({
      ...district,
      taluks: sortByTamilName(district.taluks).map((taluk) => ({
        ...taluk,
        villages: sortByTamilName(taluk.villages),
      })),
    })),
  }
}

export const requestedRoles = [
  { value: 'PARTNER', label: 'கிராம பங்குதாரர் / Village Partner' },
  { value: 'VILLAGE_ADMIN', label: 'கிராம பொறுப்பாளர் / Village Admin' },
  { value: 'TALUK_ADMIN', label: 'தாலுகா பொறுப்பாளர் / Taluk Admin' },
  { value: 'DISTRICT_ADMIN', label: 'மாவட்ட பொறுப்பாளர் / District Admin' },
]

export const idProofOptions = [
  { value: 'AADHAR_CARD', label: 'ஆதார் அட்டை / Aadhar Card' },
  { value: 'VOTER_ID', label: 'வாக்காளர் அடையாள அட்டை / Voter ID Card' },
  { value: 'RATION_CARD', label: 'குடும்ப அட்டை / Ration Card' },
  { value: 'PAN_CARD', label: 'பான் அட்டை / PAN Card' },
  { value: 'DRIVING_LICENSE', label: 'ஓட்டுநர் உரிமம் / Driving License' },
]

export const tamilNaduState = sortHierarchyByTamilName(tamilNaduHierarchy)
export const tamilNaduDistricts = tamilNaduState.districts

const englishNameByCode = new Map()

export function applyGeoEnglishNames(units = []) {
  for (const unit of units) {
    if (!unit.code) continue
    const englishName = String(unit.englishName || '').trim()
    if (!englishName) continue
    const rawCode = String(unit.code).includes('-') ? String(unit.code).split('-').slice(1).join('-') : String(unit.code)
    englishNameByCode.set(rawCode, englishName)
  }
}

export async function loadGeoEnglishNames() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'https://git-pipeline.metatronhost.in/tnnalavariyam/api'}/hierarchy/geo-units`,
      { method: 'GET', cache: 'no-store' }
    )
    if (!response.ok) return
    const data = await response.json()
    applyGeoEnglishNames(data.units || [])
  } catch {
    // Admin-edited English names are optional; fall back to transliteration.
  }
}

loadGeoEnglishNames()

function withEnglishName(item) {
  if (!item) return ''
  const explicit = englishNameByCode.get(item.code) || item.englishName
  const englishName = explicit || transliterateTamil(item.name)
  return englishName && englishName !== item.name ? `${item.name} / ${englishName}` : item.name
}

// Bilingual "Tamil / English" label for a hierarchy item (district, taluk, etc.).
// Prefers the admin-edited English name from the database; falls back to transliteration.
export function bilingualName(item) {
  if (!item) return ''
  return withEnglishName(item)
}

// District dropdown options with the Tamil name as the stored value and a
// bilingual label, matching the register page's district selector.
export const tamilNaduDistrictOptions = tamilNaduDistricts.map((district) => ({
  value: district.name,
  label: bilingualName(district),
}))