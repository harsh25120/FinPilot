import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, AlertTriangle } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import useTheme from '../hooks/useTheme'
import useToast from '../hooks/useToast'
import getErrorMessage from '../utils/getErrorMessage'
import * as authService from '../services/authService'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import ConfirmDialog from '../components/ui/ConfirmDialog'

export default function Settings() {
  const { theme, toggleTheme } = useTheme()
  const { logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)

  async function handleDeactivate() {
    setIsDeactivating(true)
    try {
      await authService.deactivateAccount()
      await logout()
      navigate('/login')
    } catch (error) {
      showToast(getErrorMessage(error), 'error')
      setIsDeactivating(false)
      setIsConfirmOpen(false)
    }
  }

  return (
    <div>
      <PageHeader title="Settings" description="App preferences and account controls." />

      <div className="max-w-2xl space-y-6">
        <Card>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Choose how FinPilot looks on this device.
          </p>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Currently using {theme} theme
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={toggleTheme}>
              Switch to {theme === 'dark' ? 'light' : 'dark'}
            </Button>
          </div>
        </Card>

        <Card className="border-rose-200 dark:border-rose-900/60">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Danger zone</h2>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Deactivating your account signs you out and disables access. Your data is kept, not
            deleted.
          </p>
          <Button variant="danger" size="sm" className="mt-4" onClick={() => setIsConfirmOpen(true)}>
            Deactivate account
          </Button>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDeactivate}
        title="Deactivate your account?"
        description="You'll be signed out immediately and won't be able to log back in until it's reactivated."
        confirmLabel="Deactivate"
        isLoading={isDeactivating}
      />
    </div>
  )
}
