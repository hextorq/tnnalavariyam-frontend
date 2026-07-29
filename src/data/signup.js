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
  { value: 'PARTNER', label: 'கிராம பங்குதாரர்' },
  { value: 'VILLAGE_ADMIN', label: 'கிராம பொறுப்பாளர்' },
  { value: 'TALUK_ADMIN', label: 'தாலுகா பொறுப்பாளர்' },
  { value: 'DISTRICT_ADMIN', label: 'மாவட்ட பொறுப்பாளர்' },
  { value: 'STATE_ADMIN', label: 'மாநில பொறுப்பாளர்' },
]

export const idProofOptions = [
  { value: 'AADHAR_CARD', label: 'Aadhar Card' },
  { value: 'VOTER_ID', label: 'Voter ID Card' },
  { value: 'RATION_CARD', label: 'Ration Card' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
]

export const tamilNaduState = sortHierarchyByTamilName(tamilNaduHierarchy)
export const tamilNaduDistricts = tamilNaduState.districts
