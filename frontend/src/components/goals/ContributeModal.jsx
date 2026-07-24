import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as goalService from '../../services/goalService'
import getErrorMessage from '../../utils/getErrorMessage'
import { todayISO } from '../../utils/formatters'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function ContributeModal({ isOpen, onClose, onSaved, goal }) {
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { amount: '', transaction_date: todayISO() } })

  useEffect(() => {
    if (isOpen) {
      reset({ amount: '', transaction_date: todayISO() })
      setFormError('')
    }
  }, [isOpen, reset])

  async function onSubmit(values) {
    setFormError('')
    try {
      await goalService.contributeToGoal(goal.id, {
        amount: Number(values.amount),
        transaction_date: values.transaction_date,
      })
      onSaved()
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  if (!goal) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Contribute to "${goal.name}"`} size="sm">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {formError}
          </p>
        )}

        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0.01"
          autoFocus
          error={errors.amount?.message}
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 0.01, message: 'Must be greater than 0' },
          })}
        />

        <Input label="Date" type="date" {...register('transaction_date', { required: true })} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add contribution
          </Button>
        </div>
      </form>
    </Modal>
  )
}
