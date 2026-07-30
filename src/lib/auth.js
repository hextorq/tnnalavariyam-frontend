const SESSION_KEY = 'tn_nalavariyam_session'
const PENDING_PROFILE_PHOTO_KEY = 'tn_nalavariyam_profile_photo_pending'

function getProfilePhotoKey(user) {
  const identifier = user?.id || user?.username || user?.email
  return identifier ? `tn_nalavariyam_profile_photo_${identifier}` : ''
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function isAuthenticated() {
  return Boolean(getSession()?.token)
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  const pendingPhoto = localStorage.getItem(PENDING_PROFILE_PHOTO_KEY)
  const profilePhotoKey = getProfilePhotoKey(session?.user)
  if (pendingPhoto && profilePhotoKey) {
    localStorage.setItem(profilePhotoKey, pendingPhoto)
    localStorage.removeItem(PENDING_PROFILE_PHOTO_KEY)
  }
  window.dispatchEvent(new Event('authchange'))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('authchange'))
}

export function saveProfilePhoto(photoUrl) {
  if (photoUrl) {
    localStorage.setItem(PENDING_PROFILE_PHOTO_KEY, photoUrl)
    window.dispatchEvent(new Event('authchange'))
  }
}

export function getProfilePhoto(user) {
  const profilePhotoKey = getProfilePhotoKey(user)
  return (profilePhotoKey && localStorage.getItem(profilePhotoKey)) || localStorage.getItem(PENDING_PROFILE_PHOTO_KEY) || ''
}

export function clearProfilePhoto(user) {
  const profilePhotoKey = getProfilePhotoKey(user)
  if (profilePhotoKey) {
    localStorage.removeItem(profilePhotoKey)
  }
  localStorage.removeItem(PENDING_PROFILE_PHOTO_KEY)
  window.dispatchEvent(new Event('authchange'))
}
