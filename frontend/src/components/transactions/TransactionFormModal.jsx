import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as transactionService from '../../services/transactionService'
import * as categoryService from '../../services/categoryService'
import * as goalService from '../../services/goalService'
import getErrorMessage from '../../utils/getErrorMessage'
import { todayISO } from '../../utils/formatters'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'
import Button from '../ui/Button'

const EMPTY_DEFAULTS = {
  type: 'expense',
  amount: '',
  category_id: '',
  goal_id: '',
  description: '',
  transaction_date: todayISO(),
}

export default function TransactionFormModal({ isOpen, onClose, onSaved, transaction }) {
  const isEditing = Boolean(transaction)
  const [formError, setFormError] = useState('')
  const [categories, setCategories] = useState([])
  const [goals, setGoals] = useState([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_DEFAULTS })

  const type = watch('type')

  // Load categories + goals once whenever the modal opens, then reset the
  // form to either the transaction being edited or a blank "new" state.
  useEffect(() => {
    if (!isOpen) return

    setFormError('')
    reset(
      transaction
        ? {
            type: transaction.type,
            amount: transaction.amount,
            category_id: transaction.category_id || '',
            goal_id: transaction.goal_id || '',
            description: transaction.description || '',
            transaction_date: transaction.transaction_date,
          }
        : EMPTY_DEFAULTS
    )

    setIsLoadingOptions(true)
    Promise.all([categoryService.listCategories(), goalService.listGoals({ page_size: 100 })])
      .then(([categoryData, goalData]) => {
        setCategories(categoryData)
        setGoals(goalData.items)
      })
      .catch((err) => setFormError(getErrorMessage(err)))
      .finally(() => setIsLoadingOptions(false))
  }, [isOpen, transaction, reset])

  const filteredCategories = categories.filter((c) => c.type === type)

  async function onSubmit(values) {
    setFormError('')
    try {
      if (isEditing) {
        const payload = {
          amount: Number(values.amount),
          description: values.description || null,
          transaction_date: values.transaction_date,
        }
        if (transaction.type !== 'transfer') {
          payload.category_id = Number(values.category_id)
        } else {
          payload.goal_id = Number(values.goal_id)
        }
        await transactionService.updateTransaction(transaction.id, payload)
      } else {
        const payload = {
          type: values.type,
          amount: Number(values.amount),
          description: values.description || null,
          transaction_date: values.transaction_date,
        }
        if (values.type === 'transfer') {
          payload.goal_id = Number(values.goal_id)
        } else {
          payload.category_id = Number(values.category_id)
        }
        await transactionService.createTransaction(payload)
      }
      onSaved()
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit transaction' : 'New transaction'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {formError}
          </p>
        )}

        <Select
          label="Type"
          disabled={isEditing}
          hint={isEditing ? "A transaction's type can't be changed after creation." : undefined}
          {...register('type', { required: true })}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
          <option value="transfer">Transfer to goal</option>
        </Select>

        <Input
          label="Amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          error={errors.amount?.message}
          {...register('amount', {
            required: 'Amount is required',
            min: { value: 0.01, message: 'Must be greater than 0' },
          })}
        />

        {type === 'transfer' ? (
          <Select
            label="Goal"
            disabled={isLoadingOptions}
            error={errors.goal_id?.message}
            {...register('goal_id', { required: 'Please select a goal' })}
          >
            <option value="">{isLoadingOptions ? 'Loading…' : 'Select a goal'}</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.name}
              </option>
            ))}
          </Select>
        ) : (
          <Select
            label="Category"
            disabled={isLoadingOptions}
            error={errors.category_id?.message}
            {...register('category_id', { required: 'Please select a category' })}
          >
            <option value="">{isLoadingOptions ? 'Loading…' : 'Select a category'}</option>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        )}

        <Input label="Date" type="date" error={errors.transaction_date?.message} {...register('transaction_date', { required: 'Date is required' })} />

        <Textarea label="Description (optional)" placeholder="Add a note…" {...register('description')} />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Add transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
