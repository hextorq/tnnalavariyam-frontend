import tamilNaduHierarchy from './tamilNaduHierarchy.json'

export const requestedRoles = [
  { value: 'PARTNER', label: 'Village Partner' },
  { value: 'VILLAGE_ADMIN', label: 'Village Admin' },
  { value: 'TALUK_ADMIN', label: 'Taluk Admin' },
  { value: 'DISTRICT_ADMIN', label: 'District Admin' },
  { value: 'STATE_ADMIN', label: 'State Admin' },
]

export const idProofOptions = [
  { value: 'AADHAR_CARD', label: 'Aadhar Card' },
  { value: 'VOTER_ID', label: 'Voter ID Card' },
  { value: 'RATION_CARD', label: 'Ration Card' },
  { value: 'PAN_CARD', label: 'PAN Card' },
  { value: 'DRIVING_LICENSE', label: 'Driving License' },
]

export const tamilNaduState = tamilNaduHierarchy
export const tamilNaduDistricts = tamilNaduHierarchy.districts
