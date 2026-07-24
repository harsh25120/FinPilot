import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as goalService from '../../services/goalService'
import getErrorMessage from '../../utils/getErrorMessage'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Textarea from '../ui/Textarea'
import Select from '../ui/Select'
import Button from '../ui/Button'

const EMPTY_DEFAULTS = { name: '', description: '', target_amount: '', target_date: '', status: 'in_progress' }

export default function GoalFormModal({ isOpen, onClose, onSaved, goal }) {
  const isEditing = Boolean(goal)
  const [formError, setFormError] = useState('')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_DEFAULTS })

  useEffect(() => {
    if (!isOpen) return
    setFormError('')
    reset(
      goal
        ? {
            name: goal.name,
            description: goal.description || '',
            target_amount: goal.target_amount,
            target_date: goal.target_date || '',
            status: goal.status,
          }
        : EMPTY_DEFAULTS
    )
  }, [isOpen, goal, reset])

  async function onSubmit(values) {
    setFormError('')
    try {
      if (isEditing) {
        await goalService.updateGoal(goal.id, {
          name: values.name,
          description: values.description || null,
          target_amount: Number(values.target_amount),
          target_date: values.target_date || null,
          status: values.status,
        })
      } else {
        await goalService.createGoal({
          name: values.name,
          description: values.description || null,
          target_amount: Number(values.target_amount),
          target_date: values.target_date || null,
        })
      }
      onSaved()
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit goal' : 'New goal'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {formError}
          </p>
        )}

        <Input
          label="Goal name"
          placeholder="e.g. Emergency fund"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />

        <Textarea label="Description (optional)" placeholder="What's this goal for?" {...register('description')} />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Target amount"
            type="number"
            step="0.01"
            min="0.01"
            error={errors.target_amount?.message}
            {...register('target_amount', {
              required: 'Target amount is required',
              min: { value: 0.01, message: 'Must be greater than 0' },
            })}
          />
          <Input label="Target date (optional)" type="date" {...register('target_date')} />
        </div>

        {isEditing && (
          <Select label="Status" {...register('status')}>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Create goal'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
