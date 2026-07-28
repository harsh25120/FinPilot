import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
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
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      {!compact && (
        <div className="mx-auto h-[220px] w-[220px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categories}
                dataKey="amount"
                nameKey="category_name"
                innerRadius={60}
                outerRadius={95}
                paddingAngle={2}
                strokeWidth={0}
              >
                {categories.map((entry) => (
                  <Cell key={entry.category_id} fill={entry.color || '#6366F1'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip currency={currency} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <ul className={`w-full ${compact ? 'space-y-3' : 'flex-1 space-y-4'}`}>
        {categories.map((category) => (
          <li key={category.category_id} className="flex items-center gap-2.5">
            <CategoryIcon icon={category.icon} color={category.color} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-700 dark:text-slate-300">
                {category.category_name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {formatCurrency(category.amount, currency)}
              </p>
              <p className="text-xs text-slate-400">{category.percentage.toFixed(0)}%</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
