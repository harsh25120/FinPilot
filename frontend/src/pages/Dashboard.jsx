import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ArrowRight,
  AlertTriangle,
  ArrowLeftRight,
} from 'lucide-react'
import * as dashboardService from '../services/dashboardService'
import useAuth from '../hooks/useAuth'
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters'
import getErrorMessage from '../utils/getErrorMessage'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import StatCard from '../components/ui/StatCard'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import CategoryIcon from '../components/ui/CategoryIcon'
import CashFlowChart from '../components/dashboard/CashFlowChart'
import SpendingBreakdown from '../components/dashboard/SpendingBreakdown'
import GoalCard from '../components/goals/GoalCard'

const TYPE_STYLES = {
  income: 'text-emerald-600 dark:text-emerald-400',
  expense: 'text-rose-600 dark:text-rose-400',
  transfer: 'text-indigo-600 dark:text-indigo-400',
}
const TYPE_SIGN = { income: '+', expense: '-', transfer: '' }

export default function Dashboard() {
  const { user } = useAuth()
  const currency = user?.preferred_currency || 'USD'

  const [overview, setOverview] = useState(null)
  const [cashFlow, setCashFlow] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadData() {
    setIsLoading(true)
    setError('')
    try {
      const [overviewData, cashFlowData] = await Promise.all([
        dashboardService.getOverview(),
        dashboardService.getCashFlow(6),
      ])
      setOverview(overviewData)
      setCashFlow(cashFlowData)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    )
  }

  if (error) {
    return <ErrorState description={error} onRetry={loadData} />
  }

  const firstName = user?.full_name?.split(' ')[0]

  return (
    <div>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName} 👋` : "Dashboard"}
        description={
          overview.total_balance < 0
            ? `Your account balance is negative. Time to slow down on spending.`
            : overview.net_savings > 0
            ? `Great job! You're saving money this month. Keep it up.`
            : overview.net_savings === 0
            ? `You've broken even this month.`
            : `You're spending more than you're earning this month.`
        }
      />

      {overview.budget_alerts_count > 0 && (
        <Link
          to="/budgets"
          className="mb-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
        >
          <AlertTriangle size={16} className="shrink-0" />
          <span className="flex-1">
            {overview.budget_alerts_count} budget{overview.budget_alerts_count > 1 ? 's are' : ' is'}{' '}
            near or over its limit.
          </span>
          <ArrowRight size={16} className="shrink-0" />
        </Link>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Current balance"
          value={formatCurrency(overview.total_balance, currency, false)}
          subtext={
            overview.total_balance < 0
              ? "⚠ Expenses exceed income"
              : undefined
          }
          icon={Wallet}
          color={overview.total_balance < 0 ? "red" : "indigo"}
          danger={overview.total_balance < 0}
        />
        <StatCard
          label="Monthly income"
          value={formatCurrency(overview.total_income, currency, false)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          label="Monthly expenses"
          value={formatCurrency(overview.total_expense, currency, false)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          label="Net savings"
          value={formatCurrency(overview.net_savings, currency, false)}
          subtext={`${formatPercent(overview.savings_rate)} savings rate`}
          icon={PiggyBank}
          color={overview.net_savings < 0 ? "red" : "amber"}
          danger={overview.net_savings < 0}
        />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Income vs Expenses</h2>
          <CashFlowChart points={cashFlow.points} />
        </Card>
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            Top spending this month
          </h2>
          <SpendingBreakdown
            categories={overview.top_spending_categories}
            compact
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Recent transactions
            </h2>
            <Link
              to="/transactions"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              View all
            </Link>
          </div>
          {overview.recent_transactions.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No transactions yet"
              description="Your recent activity will show up here."
            />
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {overview.recent_transactions.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <CategoryIcon icon={t.category?.icon} color={t.category?.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                      {t.description || t.category?.name || 'Goal contribution'}
                    </p>
                    <p className="text-xs text-slate-500">
                        {t.category?.name} • {formatDate(t.transaction_date)}
                    </p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold ${TYPE_STYLES[t.type]}`}>
                    {TYPE_SIGN[t.type]}
                    {formatCurrency(t.amount, t.currency)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Savings goals</h2>
            <Link
              to="/goals"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              View all
            </Link>
          </div>
          {overview.active_goals.length === 0 ? (
            <EmptyState
              icon={PiggyBank}
              title="No active goals"
              description="Set a savings goal to start tracking progress."
            />
          ) : (
            <div className="space-y-3">
              {overview.active_goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
