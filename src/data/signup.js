import tamilNaduHierarchy from './tamilNaduHierarchy.json'

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

export const tamilNaduState = tamilNaduHierarchy
export const tamilNaduDistricts = tamilNaduHierarchy.districts
