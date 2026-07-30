import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { NotificationContext } from '../lib/notifications.js'

const styles = {
  success: {
    icon: CheckCircle2,
    border: 'border-green-600',
    bg: 'bg-green-50',
    text: 'text-green-900',
    iconBg: 'bg-green-600',
  },
  error: {
    icon: XCircle,
    border: 'border-red-600',
    bg: 'bg-red-50',
    text: 'text-red-900',
    iconBg: 'bg-red-600',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-500',
    bg: 'bg-amber-50',
    text: 'text-amber-950',
    iconBg: 'bg-amber-500',
  },
  info: {
    icon: Info,
    border: 'border-[#007cba]',
    bg: 'bg-[#eef8ff]',
    text: 'text-neutral-950',
    iconBg: 'bg-[#007cba]',
  },
}

function notificationStyle(type) {
  return styles[type] || styles.info
}

export function NotificationsProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [popup, setPopup] = useState(null)

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((notification) => {
    const id = `${Date.now()}-${Math.random()}`
    const nextNotification = {
      id,
      type: notification.type || 'info',
      title: notification.title || 'Notice',
      message: notification.message || '',
      actionLabel: notification.actionLabel || 'OK',
    }

    if (notification.toast !== false) {
      setToasts((current) => [nextNotification, ...current].slice(0, 3))
      window.setTimeout(() => removeToast(id), notification.duration || 6000)
    }

    if (notification.popup === true) {
      setPopup(nextNotification)
    }
  }, [removeToast])

  const contextValue = useMemo(() => ({ notify }), [notify])

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed left-3 right-3 top-4 z-50 grid gap-3 sm:left-auto sm:right-5 sm:w-[420px]">
        {toasts.map((toast) => {
          const style = notificationStyle(toast.type)
          const Icon = style.icon
          return (
            <div className={`pointer-events-auto flex gap-3 border-l-4 ${style.border} ${style.bg} p-4 shadow-xl`} key={toast.id}>
              <span className={`mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-white ${style.iconBg}`}>
                <Icon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-base font-bold ${style.text}`}>{toast.title}</p>
                <p className="mt-1 text-sm leading-6 text-neutral-700">{toast.message}</p>
              </div>
              <button className="size-8 shrink-0 text-neutral-500 hover:text-neutral-950" onClick={() => removeToast(toast.id)} type="button">
                <X size={18} />
              </button>
            </div>
          )
        })}
      </div>
      {popup && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg bg-white p-5 shadow-2xl sm:p-7">
            {(() => {
              const style = notificationStyle(popup.type)
              const Icon = style.icon
              return (
                <>
                  <div className="flex items-start gap-4">
                    <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-full text-white ${style.iconBg}`}>
                      <Icon size={26} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className={`text-xl font-bold sm:text-2xl ${style.text}`}>{popup.title}</h2>
                      <p className="mt-3 text-base leading-7 text-neutral-700">{popup.message}</p>
                    </div>
                    <button className="size-9 shrink-0 text-neutral-500 hover:text-neutral-950" onClick={() => setPopup(null)} type="button">
                      <X size={20} />
                    </button>
                  </div>
                  <button className="mt-6 w-full bg-[#f0ad4e] px-5 py-3 text-sm font-bold text-neutral-950 sm:w-auto" onClick={() => setPopup(null)} type="button">
                    {popup.actionLabel}
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}
