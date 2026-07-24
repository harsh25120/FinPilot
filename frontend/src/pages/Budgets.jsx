import { useEffect, useState } from 'react'
import { Plus, Wallet2 } from 'lucide-react'
import * as budgetService from '../services/budgetService'
import useToast from '../hooks/useToast'
import getErrorMessage from '../utils/getErrorMessage'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import BudgetCard from '../components/budgets/BudgetCard'
import BudgetFormModal from '../components/budgets/BudgetFormModal'

export default function Budgets() {
  const { showToast } = useToast()

  const [budgets, setBudgets] = useState([])
  const [statusByBudgetId, setStatusByBudgetId] = useState({})
  const [meta, setMeta] = useState({ total: 0, page: 1, page_size: 9, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [activeOnly, setActiveOnly] = useState(true)
  const [page, setPage] = useState(1)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [deletingBudget, setDeletingBudget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function loadBudgets() {
    setIsLoading(true)
    setError('')
    try {
      const data = await budgetService.listBudgets({ active_only: activeOnly, page, page_size: 9 })
      setBudgets(data.items)
      setMeta(data.meta)

      const statuses = await Promise.all(data.items.map((b) => budgetService.getBudgetStatus(b.id)))
      const statusMap = {}
      data.items.forEach((b, i) => {
        statusMap[b.id] = statuses[i]
      })
      setStatusByBudgetId(statusMap)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBudgets()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly, page])

  function openCreateForm() {
    setEditingBudget(null)
    setIsFormOpen(true)
  }

  function openEditForm(budget) {
    setEditingBudget(budget)
    setIsFormOpen(true)
  }

  function handleSaved() {
    setIsFormOpen(false)
    loadBudgets()
    showToast(editingBudget ? 'Budget updated.' : 'Budget created.')
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await budgetService.deleteBudget(deletingBudget.id)
      setDeletingBudget(null)
      loadBudgets()
      showToast('Budget deleted.')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Budgets"
        description="Set spending limits per category and get alerted before you go over."
        action={
          <Button leftIcon={Plus} onClick={openCreateForm}>
            New budget
          </Button>
        }
      />

      <div className="mb-5">
        <Select
          value={activeOnly ? 'active' : 'all'}
          onChange={(e) => {
            setPage(1)
            setActiveOnly(e.target.value === 'active')
          }}
          className="w-48"
        >
          <option value="active">Active budgets</option>
          <option value="all">All budgets</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size={28} />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={loadBudgets} />
      ) : budgets.length === 0 ? (
        <EmptyState
          icon={Wallet2}
          title="No budgets yet"
          description="Create a budget to start tracking spending against a limit."
          action={
            <Button size="sm" leftIcon={Plus} onClick={openCreateForm}>
              New budget
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((budget) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                status={statusByBudgetId[budget.id]}
                onEdit={() => openEditForm(budget)}
                onDelete={() => setDeletingBudget(budget)}
              />
            ))}
          </div>
          <div className="mt-4">
            <Pagination page={meta.page} pages={meta.pages} total={meta.total} onPageChange={setPage} />
          </div>
        </>
      )}

      <BudgetFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
        budget={editingBudget}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingBudget)}
        onClose={() => setDeletingBudget(null)}
        onConfirm={handleDelete}
        title="Delete budget?"
        description={`The budget for "${deletingBudget?.category?.name}" will be permanently deleted.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  )
}
