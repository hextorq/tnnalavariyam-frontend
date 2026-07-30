import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function ApiLoadingOverlay() {
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let showTimer
    let hideTimer

    function handleLoadingChange(event) {
      const nextLoading = Boolean(event.detail?.loading)
      setLoading(nextLoading)

      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)

      if (nextLoading) {
        showTimer = window.setTimeout(() => setVisible(true), 180)
      } else {
        hideTimer = window.setTimeout(() => setVisible(false), 120)
      }
    }

    window.addEventListener('api-loading-change', handleLoadingChange)
    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
      window.removeEventListener('api-loading-change', handleLoadingChange)
    }
  }, [])

  if (!visible && !loading) return null

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/25 px-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-xs items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
        <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-[#eef8ff] text-[#007cba]">
          <LoaderCircle className="animate-spin" size={22} />
        </span>
        <div>
          <p className="text-sm font-extrabold text-slate-950">Please wait</p>
          <p className="mt-1 text-xs font-semibold text-slate-500">தகவல் செயலாக்கப்படுகிறது / Processing request</p>
        </div>
      </div>
    </div>
  )
}
