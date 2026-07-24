import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { formatCurrency } from '../../utils/formatters'
import useAuth from '../../hooks/useAuth'
import EmptyState from '../ui/EmptyState'
import { TrendingUp } from 'lucide-react'

const DIRECTION_META = {
  up: { icon: ArrowUp, className: 'text-rose-600 dark:text-rose-400' },
  down: { icon: ArrowDown, className: 'text-emerald-600 dark:text-emerald-400' },
  flat: { icon: Minus, className: 'text-slate-400' },
}

export default function TrendsList({ trends }) {
  const { user } = useAuth()
  const currency = user?.preferred_currency || 'USD'

  if (!trends.length) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Not enough data yet"
        description="Trends compare this month's spending to last month's, once you have data for both."
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {trends.map((trend) => {
        const { icon: Icon, className } = DIRECTION_META[trend.direction]
        return (
          <li key={trend.category_id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{trend.category_name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {formatCurrency(trend.previous_period_amount, currency)} → {formatCurrency(trend.current_period_amount, currency)}
              </p>
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${className}`}>
              <Icon size={14} />
              {trend.change_percentage !== null ? `${Math.abs(trend.change_percentage).toFixed(0)}%` : formatCurrency(trend.change_amount, currency)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
