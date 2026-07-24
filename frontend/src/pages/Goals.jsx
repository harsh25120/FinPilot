import { useEffect, useState } from 'react'
import { Plus, Target, PiggyBank } from 'lucide-react'
import * as goalService from '../services/goalService'
import useToast from '../hooks/useToast'
import getErrorMessage from '../utils/getErrorMessage'
import { GOAL_STATUSES } from '../utils/constants'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import Select from '../components/ui/Select'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import GoalCard from '../components/goals/GoalCard'
import GoalFormModal from '../components/goals/GoalFormModal'
import ContributeModal from '../components/goals/ContributeModal'

export default function Goals() {
  const { showToast } = useToast()

  const [goals, setGoals] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, page_size: 9, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [contributingGoal, setContributingGoal] = useState(null)
  const [deletingGoal, setDeletingGoal] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function loadGoals() {
    setIsLoading(true)
    setError('')
    try {
      const params = { page, page_size: 9 }
      if (statusFilter) params.status = statusFilter
      const data = await goalService.listGoals(params)
      setGoals(data.items)
      setMeta(data.meta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadGoals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, page])

  function openCreateForm() {
    setEditingGoal(null)
    setIsFormOpen(true)
  }

  function handleSaved() {
    setIsFormOpen(false)
    loadGoals()
    showToast(editingGoal ? 'Goal updated.' : 'Goal created.')
  }

  function handleContributed() {
    setContributingGoal(null)
    loadGoals()
    showToast('Contribution added.')
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await goalService.deleteGoal(deletingGoal.id)
      setDeletingGoal(null)
      loadGoals()
      showToast('Goal deleted.')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Set savings targets and track your progress toward them."
        action={
          <Button leftIcon={Plus} onClick={openCreateForm}>
            New goal
          </Button>
        }
      />

      <div className="mb-5">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setPage(1)
            setStatusFilter(e.target.value)
          }}
          className="w-48"
        >
          <option value="">All statuses</option>
          {GOAL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size={28} />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={loadGoals} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No goals yet"
          description="Create a savings goal and start contributing toward it."
          action={
            <Button size="sm" leftIcon={Plus} onClick={openCreateForm}>
              New goal
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                footer={
                  <div className="flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={Target}
                      disabled={goal.status !== 'in_progress'}
                      onClick={() => setContributingGoal(goal)}
                      className="flex-1"
                    >
                      Contribute
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setEditingGoal(goal); setIsFormOpen(true) }}>
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-rose-600 dark:text-rose-400" onClick={() => setDeletingGoal(goal)}>
                      Delete
                    </Button>
                  </div>
                }
              />
            ))}
          </div>
          <div className="mt-4">
            <Pagination page={meta.page} pages={meta.pages} total={meta.total} onPageChange={setPage} />
          </div>
        </>
      )}

      <GoalFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSaved={handleSaved} goal={editingGoal} />

      <ContributeModal
        isOpen={Boolean(contributingGoal)}
        onClose={() => setContributingGoal(null)}
        onSaved={handleContributed}
        goal={contributingGoal}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingGoal)}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleDelete}
        title="Delete goal?"
        description={`"${deletingGoal?.name}" will be permanently deleted. This fails if it has contributions attached.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  )
}
