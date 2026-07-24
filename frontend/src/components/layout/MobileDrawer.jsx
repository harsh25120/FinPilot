import { NavLink } from 'react-router-dom'
import { createPortal } from 'react-dom'
import { Wallet, X } from 'lucide-react'
import navConfig from './navConfig'

export default function MobileDrawer({ isOpen, onClose }) {
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="fixed inset-0 bg-slate-950/50" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-slate-900">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Wallet size={17} />
            </div>
            <span className="text-base font-semibold text-slate-900 dark:text-white">FinPilot</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navConfig.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>,
    document.body
  )
}
