import { useEffect } from 'react'

const KEEP_ALIVE_INTERVAL_MS = 2 * 60 * 1000

export default function KeepAlive() {
  useEffect(() => {
    let timer

    async function ping() {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'https://git-pipeline.metatronhost.in/tnnalavariyam/api'}/health`,
          { method: 'GET', cache: 'no-store' }
        )
        if (!response.ok && response.status !== 503) return
      } catch {
        // Keep the server warm; failure is fine (it will warm up on next real request)
      }
    }

    ping()
    timer = window.setInterval(ping, KEEP_ALIVE_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [])

  return null
}