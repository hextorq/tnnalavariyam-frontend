import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ApiLoadingOverlay() {
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)
  const [forceHidden, setForceHidden] = useState(false)

  useEffect(() => {
    let showTimer
    let hideTimer
    let maxTimer

    function handleLoadingChange(event) {
      const nextLoading = Boolean(event.detail?.loading)
      setLoading(nextLoading)
      setForceHidden(false)

      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
      window.clearTimeout(maxTimer)

      if (nextLoading) {
        showTimer = window.setTimeout(() => setVisible(true), 180)
        maxTimer = window.setTimeout(() => {
          setForceHidden(true)
          setVisible(false)
        }, 20000)
      } else {
        hideTimer = window.setTimeout(() => setVisible(false), 120)
      }
    }

    window.addEventListener('api-loading-change', handleLoadingChange)
    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
      window.clearTimeout(maxTimer)
      window.removeEventListener('api-loading-change', handleLoadingChange)
    }
  }, [])

  if (!visible && !loading) return null
  if (forceHidden) return null

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/30 px-4 backdrop-blur-[3px]">
      <div className="flex w-full max-w-sm items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <span className="inline-flex size-16 shrink-0 items-center justify-center rounded-full bg-[#eef8ff] text-[#007cba] ring-8 ring-[#eef8ff]/60">
          <LoaderCircle className="animate-spin" size={34} />
        </span>
        <div>
          <p className="text-lg font-extrabold text-slate-950">Please wait</p>
          <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">தகவல் செயலாக்கப்படுகிறது / Processing request</p>
        </div>
      </div>
    </div>
  )
}
