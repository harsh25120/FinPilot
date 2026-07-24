import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as budgetService from '../../services/budgetService'
import * as categoryService from '../../services/categoryService'
import getErrorMessage from '../../utils/getErrorMessage'
import { todayISO } from '../../utils/formatters'
import { BUDGET_PERIODS } from '../../utils/constants'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'

export default function BudgetFormModal({ isOpen, onClose, onSaved, budget }) {
  const isEditing = Boolean(budget)
  const [formError, setFormError] = useState('')
  const [expenseCategories, setExpenseCategories] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      category_id: '',
      amount: '',
      period: 'monthly',
      start_date: todayISO(),
      alert_threshold: 80,
    },
  })

  useEffect(() => {
    if (!isOpen) return

    setFormError('')
    reset(
      budget
        ? {
            category_id: budget.category_id,
            amount: budget.amount,
            period: budget.period,
            start_date: budget.start_date,
            alert_threshold: Math.round(budget.alert_threshold * 100),
          }
        : { category_id: '', amount: '', period: 'monthly', start_date: todayISO(), alert_threshold: 80 }
    )

    setIsLoadingOptions(true)
    categoryService
      .listCategories({ type: 'expense' })
      .then(setExpenseCategories)
      .catch((err) => setFormError(getErrorMessage(err)))
      .finally(() => setIsLoadingOptions(false))
  }, [isOpen, budget, reset])

  async function onSubmit(values) {
    setFormError('')
    try {
      if (isEditing) {
        await budgetService.updateBudget(budget.id, {
          amount: Number(values.amount),
          alert_threshold: Number(values.alert_threshold) / 100,
          start_date: values.start_date,
        })
      } else {
        await budgetService.createBudget({
          category_id: Number(values.category_id),
          amount: Number(values.amount),
          period: values.period,
          start_date: values.start_date,
          alert_threshold: Number(values.alert_threshold) / 100,
        })
      }
      onSaved()
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit budget' : 'New budget'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {formError}
          </p>
        )}

        <Select
          label="Category"
          disabled={isLoadingOptions || isEditing}
          error={errors.category_id?.message}
          hint={isEditing ? "A budget's category can't be changed after creation." : 'Budgets can only be set for expense categories.'}
          {...register('category_id', { required: 'Please select a category' })}
        >
          <option value="">{isLoadingOptions ? 'Loading…' : 'Select a category'}</option>
          {expenseCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>

        <Input
          label="Budget amount"
          type="number"
          step="0.01"
          min="0.01"
          error={errors.amount?.message}
          {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Must be greater than 0' } })}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select label="Period" disabled={isEditing} hint={isEditing ? 'Fixed after creation.' : undefined} {...register('period')}>
            {BUDGET_PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
          <Input label="Start date" type="date" error={errors.start_date?.message} {...register('start_date', { required: 'Start date is required' })} />
        </div>

        <Input
          label="Alert threshold (%)"
          type="number"
          min="0"
          max="100"
          hint="You'll see this budget flagged once spending crosses this percentage."
          error={errors.alert_threshold?.message}
          {...register('alert_threshold', {
            required: true,
            min: { value: 0, message: 'Must be between 0 and 100' },
            max: { value: 100, message: 'Must be between 0 and 100' },
          })}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Create budget'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
