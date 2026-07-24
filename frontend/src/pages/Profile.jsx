import { useState } from 'react'
import { useForm } from 'react-hook-form'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import getErrorMessage from '../utils/getErrorMessage'
import { formatDate } from '../utils/formatters'
import { CURRENCIES } from '../utils/constants'
import * as authService from '../services/authService'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import PasswordInput from '../components/ui/PasswordInput'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const { showToast } = useToast()

  return (
    <div>
      <PageHeader title="Profile" description="Manage your personal and financial details." />

      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileForm user={user} updateUser={updateUser} showToast={showToast} />
        <PasswordForm showToast={showToast} />
      </div>
    </div>
  )
}

function ProfileForm({ user, updateUser, showToast }) {
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    defaultValues: {
      full_name: user?.full_name || '',
      monthly_income: user?.monthly_income || '0',
      preferred_currency: user?.preferred_currency || 'USD',
    },
  })

  async function onSubmit(values) {
    setFormError('')
    try {
      const updated = await authService.updateProfile({
        full_name: values.full_name,
        monthly_income: Number(values.monthly_income),
        preferred_currency: values.preferred_currency,
      })
      updateUser(updated)
      showToast('Profile updated.')
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Personal details</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        {user?.created_at
          ? `Member since ${formatDate(user.created_at)}`
          : 'Member since unavailable'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
        {formError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {formError}
          </p>
        )}

        <Input label="Email" value={user?.email || ''} disabled hint="Email cannot be changed." />

        <Input
          label="Full name"
          error={errors.full_name?.message}
          {...register('full_name', { required: 'Full name is required' })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Monthly income"
            type="number"
            step="0.01"
            min="0"
            error={errors.monthly_income?.message}
            {...register('monthly_income', { min: { value: 0, message: 'Must be positive' } })}
          />
          <Select label="Currency" {...register('preferred_currency')}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </div>

        <Button type="submit" isLoading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </form>
    </Card>
  )
}

function PasswordForm({ showToast }) {
  const [formError, setFormError] = useState('')
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm()

  async function onSubmit(values) {
    setFormError('')
    try {
      await authService.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
      })
      reset()
      showToast('Password changed.')
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not change your password.'))
    }
  }

  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Change password</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Use a password that's at least 8 characters, with a letter and a number.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
        {formError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {formError}
          </p>
        )}

        <PasswordInput
          label="Current password"
          autoComplete="current-password"
          error={errors.current_password?.message}
          {...register('current_password', { required: 'Current password is required' })}
        />

        <PasswordInput
          label="New password"
          autoComplete="new-password"
          error={errors.new_password?.message}
          {...register('new_password', {
            required: 'New password is required',
            minLength: { value: 8, message: 'Must be at least 8 characters' },
            maxLength: { value: 72, message: 'Must be 72 characters or fewer' },
            validate: {
              hasLetter: (v) => /[a-zA-Z]/.test(v) || 'Must contain at least one letter',
              hasDigit: (v) => /\d/.test(v) || 'Must contain at least one digit',
            },
          })}
        />

        <PasswordInput
          label="Confirm new password"
          autoComplete="new-password"
          error={errors.confirm_password?.message}
          {...register('confirm_password', {
            required: 'Please confirm your new password',
            validate: (v) => v === watch('new_password') || 'Passwords do not match',
          })}
        />

        <Button type="submit" isLoading={isSubmitting}>
          Update password
        </Button>
      </form>
    </Card>
  )
}
