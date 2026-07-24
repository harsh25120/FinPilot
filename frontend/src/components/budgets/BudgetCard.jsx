import { Pencil, Trash2, AlertTriangle } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ProgressBar from '../ui/ProgressBar'
import CategoryIcon from '../ui/CategoryIcon'
import { formatCurrency, formatDate } from '../../utils/formatters'
import useAuth from '../../hooks/useAuth'

const PERIOD_LABEL = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' }

export default function BudgetCard({ budget, status, onEdit, onDelete }) {
  const { user } = useAuth()
  const currency = user?.preferred_currency || 'USD'

  const percentage = status?.percentage_used ?? 0
  const progressColor = status?.is_exceeded ? 'red' : status?.is_alert ? 'amber' : 'indigo'

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CategoryIcon icon={budget.category.icon} color={budget.category.color} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {budget.category.name}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {PERIOD_LABEL[budget.period]} · {formatDate(budget.start_date)} – {formatDate(budget.end_date)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            onClick={onEdit}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Edit budget"
          >
            <Pencil size={15} />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            aria-label="Delete budget"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between text-sm">
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {status ? formatCurrency(status.spent, currency) : '—'}
          </span>
          <span className="text-slate-400">of {formatCurrency(budget.amount, currency)}</span>
        </div>
        <ProgressBar percentage={percentage} color={progressColor} />
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">{percentage.toFixed(0)}% used</p>
          {status?.is_exceeded ? (
            <Badge color="red">Over budget</Badge>
          ) : status?.is_alert ? (
            <Badge color="amber">
              <AlertTriangle size={10} className="mr-1 inline" />
              Near limit
            </Badge>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
