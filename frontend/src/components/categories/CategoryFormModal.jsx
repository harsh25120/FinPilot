import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import * as categoryService from '../../services/categoryService'
import getErrorMessage from '../../utils/getErrorMessage'
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../../utils/constants'
import Modal from '../ui/Modal'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Button from '../ui/Button'
import CategoryIcon from '../ui/CategoryIcon'

export default function CategoryFormModal({ isOpen, onClose, onSaved, category }) {
  const isEditing = Boolean(category)
  const [formError, setFormError] = useState('')

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { name: '', type: 'expense', icon: 'more-horizontal', color: CATEGORY_COLORS[0] },
  })

  useEffect(() => {
    if (isOpen) {
      reset(
        category
          ? {
              name: category.name,
              type: category.type,
              icon: category.icon || 'more-horizontal',
              color: category.color || CATEGORY_COLORS[0],
            }
          : { name: '', type: 'expense', icon: 'more-horizontal', color: CATEGORY_COLORS[0] }
      )
      setFormError('')
    }
  }, [isOpen, category, reset])

  const selectedIcon = watch('icon')
  const selectedColor = watch('color')

  async function onSubmit(values) {
    setFormError('')
    try {
      if (isEditing) {
        await categoryService.updateCategory(category.id, {
          name: values.name,
          icon: values.icon,
          color: values.color,
        })
      } else {
        await categoryService.createCategory(values)
      }
      onSaved()
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit category' : 'New category'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            {formError}
          </p>
        )}

        <Input
          label="Name"
          placeholder="e.g. Subscriptions"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required' })}
        />

        <Select
          label="Type"
          disabled={isEditing}
          hint={isEditing ? "A category's type can't be changed after creation." : undefined}
          {...register('type', { required: true })}
        >
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </Select>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Icon</p>
          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-9 gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                {CATEGORY_ICONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => field.onChange(iconName)}
                    className={`flex items-center justify-center rounded-lg p-1.5 transition-colors ${
                      selectedIcon === iconName
                        ? 'bg-indigo-100 dark:bg-indigo-950'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    aria-label={iconName}
                  >
                    <CategoryIcon icon={iconName} color={selectedColor} size="sm" />
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">Color</p>
          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => field.onChange(color)}
                    className={`h-7 w-7 rounded-full transition-transform ${
                      selectedColor === color ? 'scale-110 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''
                    }`}
                    style={{ backgroundColor: color, outlineColor: color }}
                    aria-label={color}
                  />
                ))}
              </div>
            )}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
