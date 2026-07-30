const SESSION_KEY = 'tn_nalavariyam_session'
const PROFILE_PHOTO_KEY = 'tn_nalavariyam_profile_photo'

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
  window.dispatchEvent(new Event('authchange'))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
  window.dispatchEvent(new Event('authchange'))
}

export function saveProfilePhoto(photoUrl) {
  if (photoUrl) {
    localStorage.setItem(PROFILE_PHOTO_KEY, photoUrl)
  }
}

export function getProfilePhoto() {
  return localStorage.getItem(PROFILE_PHOTO_KEY) || ''
}

export function clearProfilePhoto() {
  localStorage.removeItem(PROFILE_PHOTO_KEY)
}
