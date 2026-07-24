import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Tag } from 'lucide-react'
import * as categoryService from '../services/categoryService'
import useToast from '../hooks/useToast'
import useDebounce from '../hooks/useDebounce'
import getErrorMessage from '../utils/getErrorMessage'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import CategoryIcon from '../components/ui/CategoryIcon'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import CategoryFormModal from '../components/categories/CategoryFormModal'

export default function Categories() {
  const { showToast } = useToast()

  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)
  const [typeFilter, setTypeFilter] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function loadCategories() {
    setIsLoading(true)
    setError('')
    try {
      const params = {}
      if (debouncedSearch) params.search = debouncedSearch
      if (typeFilter) params.type = typeFilter
      const data = await categoryService.listCategories(params)
      setCategories(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, typeFilter])

  function openCreateForm() {
    setEditingCategory(null)
    setIsFormOpen(true)
  }

  function openEditForm(category) {
    setEditingCategory(category)
    setIsFormOpen(true)
  }

  function handleSaved() {
    setIsFormOpen(false)
    loadCategories()
    showToast(editingCategory ? 'Category updated.' : 'Category created.')
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await categoryService.deleteCategory(deletingCategory.id)
      setDeletingCategory(null)
      loadCategories()
      showToast('Category deleted.')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Organize your income and expenses."
        action={
          <Button leftIcon={Plus} onClick={openCreateForm}>
            New category
          </Button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search categories…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="sm:w-44"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size={28} />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={loadCategories} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories found"
          description="Try a different search, or create a new category."
          action={
            <Button size="sm" leftIcon={Plus} onClick={openCreateForm}>
              New category
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="flex items-center gap-3">
              <CategoryIcon icon={category.icon} color={category.color} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {category.name}
                </p>
                <Badge color={category.type === 'income' ? 'green' : 'slate'} className="mt-1">
                  {category.type === 'income' ? 'Income' : 'Expense'}
                </Badge>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  onClick={() => openEditForm(category)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  aria-label={`Edit ${category.name}`}
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => setDeletingCategory(category)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
        category={editingCategory}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingCategory)}
        onClose={() => setDeletingCategory(null)}
        onConfirm={handleDelete}
        title="Delete category?"
        description={`"${deletingCategory?.name}" will be permanently deleted. This fails if it has existing transactions or budgets attached.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  )
}
