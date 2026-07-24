import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import useAuth from '../hooks/useAuth'
import getErrorMessage from '../utils/getErrorMessage'
import { CURRENCIES } from '../utils/constants'
import Input from '../components/ui/Input'
import PasswordInput from '../components/ui/PasswordInput'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'

export default function Register() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { preferred_currency: 'USD' },
  })

  async function onSubmit(values) {
    setFormError('')
    try {
      const payload = {
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        preferred_currency: values.preferred_currency,
      }
      if (values.monthly_income) {
        payload.monthly_income = Number(values.monthly_income)
      }
      await registerUser(payload)
      navigate('/')
    } catch (error) {
      setFormError(getErrorMessage(error, 'Could not create your account.'))
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Create your account</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Start tracking your finances in a couple of minutes.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        {formError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {formError}
          </p>
        )}

        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Jane Doe"
          error={errors.full_name?.message}
          {...register('full_name', { required: 'Full name is required' })}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email', { required: 'Email is required' })}
        />

        <PasswordInput
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Must contain at least one letter and one number."
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Must be at least 8 characters' },
            maxLength: { value: 72, message: 'Must be 72 characters or fewer' },
            validate: {
              hasLetter: (v) => /[a-zA-Z]/.test(v) || 'Must contain at least one letter',
              hasDigit: (v) => /\d/.test(v) || 'Must contain at least one digit',
            },
          })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Monthly income (optional)"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
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

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
          Log in
        </Link>
      </p>
    </div>
  )
}
