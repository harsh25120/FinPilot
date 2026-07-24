import { Target } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'
import { formatCurrency, formatDate } from '../../utils/formatters'
import useAuth from '../../hooks/useAuth'

const STATUS_BADGES = {
  in_progress: { label: 'In progress', color: 'indigo' },
  completed: { label: 'Completed', color: 'green' },
  cancelled: { label: 'Cancelled', color: 'slate' },
}

export default function GoalCard({ goal, onClick, footer }) {
  const { user } = useAuth()
  const currency = user?.preferred_currency || 'USD'

  const percentage = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
  const status = STATUS_BADGES[goal.status] || STATUS_BADGES.in_progress
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0)
  
  const progressColor =
    goal.status === "completed"
      ? "green"
      : percentage >= 90
        ? "amber"
        : "indigo"

  return (
    <Card
      className={onClick ? 'cursor-pointer transition-shadow hover:shadow-md' : ''}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Target size={16} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {goal.name}
            </p>
            {goal.target_date && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target {formatDate(goal.target_date)}
              </p>
            )}
          </div>
        </div>
        <Badge color={status.color}>{status.label}</Badge>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(goal.current_amount, currency)}
          </span>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            {Math.min(percentage, 100).toFixed(0)}%
          </span>
        </div>

        <ProgressBar percentage={percentage} color={progressColor} />

        <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>
            Saved {formatCurrency(goal.current_amount, currency)}
          </span>

          <span>
            Remaining {formatCurrency(remaining, currency)}
          </span>
        </div>
      </div>

      {footer && <div className="mt-4">{footer}</div>}
    </Card>
  )
}