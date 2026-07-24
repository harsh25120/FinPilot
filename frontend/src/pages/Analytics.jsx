import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as analyticsService from '../services/analyticsService'
import * as budgetService from '../services/budgetService'
import getErrorMessage from '../utils/getErrorMessage'
import { formatPercent } from '../utils/formatters'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import ProgressBar from '../components/ui/ProgressBar'
import CashFlowChart from '../components/dashboard/CashFlowChart'
import SpendingBreakdown from '../components/dashboard/SpendingBreakdown'
import SavingsRateChart from '../components/analytics/SavingsRateChart'
import TrendsList from '../components/analytics/TrendsList'
import { Wallet2 } from 'lucide-react'

const MONTH_OPTIONS = [3, 6, 12]

export default function Analytics() {
  const [spending, setSpending] = useState(null)
  const [incomeVsExpense, setIncomeVsExpense] = useState(null)
  const [savingsRate, setSavingsRate] = useState(null)
  const [trends, setTrends] = useState(null)
  const [budgetStatuses, setBudgetStatuses] = useState([])
  const highestCategory =
    spending?.categories?.length
      ? spending.categories.reduce((max, category) =>
          category.amount > max.amount ? category : max
        ).name
      : '—'

  const averageSavingsRate = savingsRate?.average_savings_rate ?? 0

  const budgetAlerts = budgetStatuses.filter(
    (budget) => budget.alert_triggered
  ).length

  const [months, setMonths] = useState(6)
  const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' })

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAll() {
    setIsLoading(true)
    setError('')
    try {
      const spendingParams = {}
      if (dateRange.start_date) spendingParams.start_date = dateRange.start_date
      if (dateRange.end_date) spendingParams.end_date = dateRange.end_date

      const [spendingData, flowData, rateData, trendsData, budgetsData] = await Promise.all([
        analyticsService.getSpendingByCategory(spendingParams),
        analyticsService.getIncomeVsExpense(months),
        analyticsService.getSavingsRate(months),
        analyticsService.getTrends(),
        budgetService.listBudgets({ active_only: true, page_size: 50 }),
      ])

      setSpending(spendingData)
      setIncomeVsExpense(flowData)
      setSavingsRate(rateData)
      setTrends(trendsData)

      const statuses = await Promise.all(
        budgetsData.items.map((b) => budgetService.getBudgetStatus(b.id))
      )
      setBudgetStatuses(statuses)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [months, dateRange.start_date, dateRange.end_date])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={28} />
      </div>
    )
  }

  if (error) {
    return <ErrorState description={error} onRetry={loadAll} />
  }

  return (
    <div>
      <PageHeader title="Analytics" description="Deeper insight into how you earn, spend, and save." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Income vs. expense</h2>
            <Select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="w-36">
              {MONTH_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  Last {m} months
                </option>
              ))}
            </Select>
          </div>
          <CashFlowChart points={incomeVsExpense.points} />
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">Savings rate</h2>
          <p className="mb-2 text-2xl font-semibold text-slate-900 dark:text-white">
            {formatPercent(savingsRate.average_savings_rate)}
            <span className="ml-1.5 text-sm font-normal text-slate-400">average</span>
          </p>
          <SavingsRateChart points={savingsRate.points} />
        </Card>

        <Card>
          <h3 className="text-sm font-semibold">
            Insights
          </h3>

          <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <li>
              💰 Highest spending category: {highestCategory}
            </li>

            <li>
              📈 Savings rate: {formatPercent(averageSavingsRate)}
            </li>

            <li>
              📊 {budgetAlerts} budget{budgetAlerts !== 1 ? 's' : ''} need attention
            </li>
          </ul>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Spending by category</h2>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange((prev) => ({ ...prev, start_date: e.target.value }))}
                className="w-40"
              />
              <Input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange((prev) => ({ ...prev, end_date: e.target.value }))}
                className="w-40"
              />
            </div>
          </div>
          <SpendingBreakdown categories={spending.breakdown} />
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
            This month vs. last month
          </h2>
          <TrendsList trends={trends.trends} />
        </Card>
      </div>

      <Card className="mt-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Budget utilization</h2>
          <Link to="/budgets" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
            Manage budgets
          </Link>
        </div>
        {budgetStatuses.length === 0 ? (
          <EmptyState icon={Wallet2} title="No active budgets" description="Set a budget to see utilization here." />
        ) : (
          <div className="space-y-4">
            {budgetStatuses.map((status) => (
              <div key={status.budget_id}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{status.category_name}</span>
                  <span className="text-slate-500 dark:text-slate-400">{status.percentage_used.toFixed(0)}%</span>
                </div>
                <ProgressBar
                  percentage={status.percentage_used}
                  color={status.is_exceeded ? 'red' : status.is_alert ? 'amber' : 'indigo'}
                />
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
