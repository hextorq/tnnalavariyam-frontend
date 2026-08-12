import { useEffect, useState } from 'react'
import { clearSession, getSession, isAuthenticated, SESSION_DURATION_MS } from '../lib/auth.js'
import { useNotifications } from '../lib/notifications.js'
import { navigate } from '../lib/router.jsx'

export default function AutoLogout() {
  const { notify } = useNotifications()
  const [authed, setAuthed] = useState(() => isAuthenticated())

  useEffect(() => {
    const update = () => setAuthed(isAuthenticated())
    window.addEventListener('authchange', update)
    return () => window.removeEventListener('authchange', update)
  }, [])

  useEffect(() => {
    if (!authed) return undefined

    const session = getSession()
    if (!session?.token) return undefined

    const loggedInAt = Number(session.loggedInAt)
    if (!loggedInAt) {
      session.loggedInAt = Date.now()
      localStorage.setItem('tn_nalavariyam_session', JSON.stringify(session))
      return undefined
    }

    function forceLogout() {
      clearSession()
      notify({
        type: 'info',
        title: 'Session Expired / அமர்வு முடிவடைந்தது',
        message: 'You were logged out automatically after 15 minutes. Please sign in again. / 15 நிமிடங்களுக்குப் பிறகு தானாக வெளியேற்றப்பட்டீர்கள். மீண்டும் உள்நுழையவும்.',
      })
      navigate('/login')
    }

    const remaining = loggedInAt + SESSION_DURATION_MS - Date.now()
    if (remaining <= 0) {
      forceLogout()
      return undefined
    }

    const timer = setTimeout(forceLogout, remaining)
    return () => clearTimeout(timer)
  }, [authed, notify])

  return null
}
