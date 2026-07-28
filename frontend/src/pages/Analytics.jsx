import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as analyticsService from '../services/analyticsService'
import * as budgetService from '../services/budgetService'
import getErrorMessage from '../utils/getErrorMessage'
import { formatPercent } from '../utils/formatters'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Select from '../components/ui/Select'
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

function getDateRange(months) {
  const end = new Date()
  const start = new Date()

  if (months === 1) {
    start.setDate(1)
  } else {
    start.setMonth(start.getMonth() - (months - 1))
    start.setDate(1)
  }

  return {
    start_date: start.toISOString().split("T")[0],
    end_date: end.toISOString().split("T")[0],
  }
}

export default function Analytics() {
  const [spending, setSpending] = useState(null)
  const [incomeVsExpense, setIncomeVsExpense] = useState(null)
  const [savingsRate, setSavingsRate] = useState(null)
  const [trends, setTrends] = useState(null)
  const [budgetStatuses, setBudgetStatuses] = useState([])
  const highestCategory =
  spending?.breakdown?.length
    ? spending.breakdown.reduce((max, category) =>
        Number(category.amount) > Number(max.amount) ? category : max
      ).category_name
    : '—'

  const averageSavingsRate = savingsRate?.average_savings_rate ?? 0

  const budgetAlerts = budgetStatuses.filter(
    (budget) => budget.is_alert || budget.is_exceeded
  ).length

  const [months, setMonths] = useState(6)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadAll() {
    setIsLoading(true)
    setError('')

    try {
      const spendingParams = getDateRange(months)

      const [
        spendingData,
        flowData,
        rateData,
        trendsData,
        budgetsData,
      ] = await Promise.all([
        analyticsService.getSpendingByCategory(spendingParams),
        analyticsService.getIncomeVsExpense(months),
        analyticsService.getSavingsRate(months),
        analyticsService.getTrends(),
        budgetService.listBudgets({
          active_only: true,
          page_size: 50,
        }),
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
  }, [months])

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
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Analytics"
          description="Deeper insight into how you earn, spend, and save."
        />

        <Select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-44"
        >
          <option value={1}>This Month</option>
          <option value={3}>Last 3 Months</option>
          <option value={6}>Last 6 Months</option>
          <option value={12}>Last 12 Months</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Income vs. expense</h2>
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

          <div className="mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Spending by category
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {spending.breakdown.length} categories •{" "}
                {spending.breakdown.reduce(
                  (sum, c) => sum + Number(c.amount),
                  0
                ).toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })} spent
              </p>
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
