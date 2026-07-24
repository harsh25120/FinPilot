import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

const STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
  },
  error: {
    icon: AlertTriangle,
    iconClass: 'text-rose-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-indigo-500',
  },
}

export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const { icon: Icon, iconClass } = STYLES[toast.type] || STYLES.info
        return (
          <div
            key={toast.id}
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900"
          >
            <Icon size={20} className={`mt-0.5 shrink-0 ${iconClass}`} />
            <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{toast.message}</p>
            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              aria-label="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
