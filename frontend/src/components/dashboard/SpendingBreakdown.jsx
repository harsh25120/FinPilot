import { formatCurrency } from '../../utils/formatters'
import useAuth from '../../hooks/useAuth'
import CategoryIcon from '../ui/CategoryIcon'
import EmptyState from '../ui/EmptyState'
import { PieChart as PieChartIcon } from 'lucide-react'

function CustomTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-800 dark:bg-slate-900">
      <p className="font-medium text-slate-700 dark:text-slate-300">{item.category_name}</p>
      <p className="text-slate-500 dark:text-slate-400">{formatCurrency(item.amount, currency)}</p>
    </div>
  )
}

export default function SpendingBreakdown({
  categories,
  compact = false,
}) {
  const { user } = useAuth()
  const currency = user?.preferred_currency || 'USD'

  if (!categories?.length) {
    return (
      <EmptyState
        icon={PieChartIcon}
        title="No spending yet"
        description="Add an expense to see your top categories here."
      />
    )
  }

  return (
    <div className="w-full">
      <ul
        className={compact ? "space-y-3" : "space-y-5"}
        style={{ marginTop: 0 }}
      >
        {categories.map((category) => (
          <li
            key={category.category_id}
            className="space-y-2 first:mt-0"
          >

            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CategoryIcon
                  icon={category.icon}
                  color={category.color}
                  size="sm"
                />

                <p className="font-medium text-slate-200">
                  {category.category_name}
                </p>
              </div>

              <p className="font-semibold text-white">
                {formatCurrency(category.amount, currency)}
              </p>
            </div>

            {/* Bottom row */}
            <div className="pl-11">
              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${category.percentage}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>

              <p className="mt-1 text-right text-xs text-slate-400">
                {category.percentage.toFixed(0)}%
              </p>
            </div>

          </li>
        ))}
      </ul>
    </div>
  )
}
