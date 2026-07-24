import { useEffect, useState } from 'react'
import { Download, FileText } from 'lucide-react'
import * as reportService from '../services/reportService'
import useAuth from '../hooks/useAuth'
import useToast from '../hooks/useToast'
import getErrorMessage from '../utils/getErrorMessage'
import { formatCurrency, formatPercent, todayISO } from '../utils/formatters'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'

const TABS = [
  { key: 'monthly', label: 'Monthly report' },
  { key: 'yearly', label: 'Yearly report' },
]

export default function Reports() {
  const [activeTab, setActiveTab] = useState('monthly')

  return (
    <div>
      <PageHeader title="Reports" description="Generated summaries of your financial activity." />

      <div className="mb-6 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900 sm:inline-flex">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'monthly' ? <MonthlyReportSection /> : <YearlyReportSection />}

      <ExportSection />
    </div>
  )
}

function MonthlyReportSection() {
  const { user } = useAuth()
  const currency = user?.preferred_currency || 'USD'
  const [month, setMonth] = useState(todayISO().slice(0, 7))
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadReport() {
    setIsLoading(true)
    setError('')
    try {
      const [year, monthNum] = month.split('-').map(Number)
      const data = await reportService.getMonthlyReport(year, monthNum)
      setReport(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month])

  return (
    <Card className="mb-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Monthly Financial Summary</h2>
        <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size={24} />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={loadReport} />
      ) : (
        <div>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SummaryStat label="Income" value={formatCurrency(report.total_income, currency)} />
            <SummaryStat label="Expenses" value={formatCurrency(report.total_expense, currency)} />
            <SummaryStat label="Net savings" value={formatCurrency(report.net_savings, currency)} />
            <SummaryStat label="Savings rate" value={formatPercent(report.savings_rate)} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <BreakdownTable title="Income by category" rows={report.income_breakdown} currency={currency} />
            <BreakdownTable title="Expenses by category" rows={report.expense_breakdown} currency={currency} />
          </div>

          {report.budgets.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Budgets
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Category</th>
                      <th className="px-4 py-2.5 text-right font-medium">Spent</th>
                      <th className="px-4 py-2.5 text-right font-medium">Limit</th>
                      <th className="px-4 py-2.5 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.budgets.map((b) => (
                      <tr key={b.budget_id}>
                        <td className="px-4 py-2.5">{b.category_name}</td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(b.spent, currency)}</td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(b.limit, currency)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <Badge color={b.is_exceeded ? 'red' : b.is_alert ? 'amber' : 'green'}>
                            {b.is_exceeded ? 'Over' : b.is_alert ? 'Near limit' : 'On track'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {report.goals_progress.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Goal progress
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Goal</th>
                      <th className="px-4 py-2.5 text-right font-medium">Progress</th>
                      <th className="px-4 py-2.5 text-right font-medium">Remaining</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {report.goals_progress.map((g) => (
                      <tr key={g.goal_id}>
                        <td className="px-4 py-2.5">{g.name}</td>
                        <td className="px-4 py-2.5 text-right">{formatPercent(g.percentage_complete, 0)}</td>
                        <td className="px-4 py-2.5 text-right">{formatCurrency(g.remaining_amount, currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function YearlyReportSection() {
  const { user } = useAuth()
  const currency = user?.preferred_currency || 'USD'
  const [year, setYear] = useState(new Date().getFullYear())
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadReport() {
    setIsLoading(true)
    setError('')
    try {
      const data = await reportService.getYearlyReport(year)
      setReport(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year])

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <Card className="mb-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Annual Financial Summary</h2>
        <Input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="w-28"
          min="2000"
          max="2100"
        />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size={24} />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={loadReport} />
      ) : (
        <div>
          <div className="mb-6 grid grid-cols-3 gap-4">
            <SummaryStat label="Total income" value={formatCurrency(report.total_income, currency)} />
            <SummaryStat label="Total expenses" value={formatCurrency(report.total_expense, currency)} />
            <SummaryStat label="Net savings" value={formatCurrency(report.net_savings, currency)} />
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Month</th>
                  <th className="px-4 py-2.5 text-right font-medium">Income</th>
                  <th className="px-4 py-2.5 text-right font-medium">Expense</th>
                  <th className="px-4 py-2.5 text-right font-medium">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {report.monthly_breakdown.map((m) => (
                  <tr key={m.month}>
                    <td className="px-4 py-2.5">{monthNames[m.month - 1]}</td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(m.income, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400">
                      {formatCurrency(m.expense, currency)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium">{formatCurrency(m.net, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  )
}

function ExportSection() {
  const { showToast } = useToast()
  const [range, setRange] = useState({ start_date: '', end_date: '' })
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setIsExporting(true)
    try {
      const params = {}
      if (range.start_date) params.start_date = range.start_date
      if (range.end_date) params.end_date = range.end_date

      const blob = await reportService.exportTransactionsCsv(params)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'finpilot-transactions.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card>
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <FileText size={16} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Export transactions</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Download a CSV file, optionally for a date range.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          label="From"
          type="date"
          value={range.start_date}
          onChange={(e) => setRange((prev) => ({ ...prev, start_date: e.target.value }))}
          containerClassName="flex-1"
        />
        <Input
          label="To"
          type="date"
          value={range.end_date}
          onChange={(e) => setRange((prev) => ({ ...prev, end_date: e.target.value }))}
          containerClassName="flex-1"
        />
        <Button leftIcon={Download} onClick={handleExport} isLoading={isExporting}>
          Export CSV
        </Button>
      </div>
    </Card>
  )
}

function SummaryStat({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
}

function BreakdownTable({ title, rows, currency }) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      {rows.length === 0 ? (
        <EmptyState title="No data" description="Nothing recorded for this period." />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {rows.map((row) => (
            <li key={row.category_id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-slate-700 dark:text-slate-300">{row.category_name}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatCurrency(row.amount, currency)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
