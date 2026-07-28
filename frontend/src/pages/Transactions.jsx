import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, ArrowLeftRight, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react'
import * as transactionService from '../services/transactionService'
import * as categoryService from '../services/categoryService'
import useToast from '../hooks/useToast'
import useDebounce from '../hooks/useDebounce'
import getErrorMessage from '../utils/getErrorMessage'
import { formatCurrency, formatDate } from '../utils/formatters'
import { SORT_OPTIONS, DEFAULT_PAGE_SIZE } from '../utils/constants'
import PageHeader from '../components/ui/PageHeader'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import CategoryIcon from '../components/ui/CategoryIcon'
import Spinner from '../components/ui/Spinner'
import ErrorState from '../components/ui/ErrorState'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import TransactionFormModal from '../components/transactions/TransactionFormModal'

const TYPE_BADGE = { income: 'green', expense: 'red', transfer: 'indigo' }
const TYPE_SIGN = { income: '+', expense: '-', transfer: '' }
const TYPE_TEXT = { income: 'text-emerald-600 dark:text-emerald-400', expense: 'text-rose-600 dark:text-rose-400', transfer: 'text-indigo-600 dark:text-indigo-400' }

const INITIAL_FILTERS = {
  search: '',
  type: '',
  category_id: '',
  date_from: '',
  date_to: '',
  min_amount: '',
  max_amount: '',
  sort_by: 'created_at',
  sort_order: 'desc',
}

export default function Transactions() {
  const { showToast } = useToast()

  const [transactions, setTransactions] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, page_size: DEFAULT_PAGE_SIZE, pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const debouncedSearch = useDebounce(filters.search)
  const [page, setPage] = useState(1)
  const [showMoreFilters, setShowMoreFilters] = useState(false)

  const [categories, setCategories] = useState([])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [deletingTransaction, setDeletingTransaction] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    categoryService.listCategories().then(setCategories).catch(() => {})
  }, [])

  async function loadTransactions() {
    setIsLoading(true)
    setError('')
    try {
      const params = {
        page,
        page_size: DEFAULT_PAGE_SIZE,
        sort_by: filters.sort_by,
        sort_order: filters.sort_order,
      }
      if (debouncedSearch) params.search = debouncedSearch
      if (filters.type) params.type = filters.type
      if (filters.category_id) params.category_id = filters.category_id
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      if (filters.min_amount) params.min_amount = filters.min_amount
      if (filters.max_amount) params.max_amount = filters.max_amount

      const data = await transactionService.listTransactions(params)
      setTransactions(data.items)
      setMeta(data.meta)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    debouncedSearch,
    filters.type,
    filters.category_id,
    filters.date_from,
    filters.date_to,
    filters.min_amount,
    filters.max_amount,
    filters.sort_by,
    filters.sort_order,
  ])

  function updateFilter(key, value) {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function toggleSortOrder() {
    updateFilter('sort_order', filters.sort_order === 'desc' ? 'asc' : 'desc')
  }

  function openCreateForm() {
    setEditingTransaction(null)
    setIsFormOpen(true)
  }

  function openEditForm(transaction) {
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }

  function handleSaved() {
    setIsFormOpen(false)
    loadTransactions()
    showToast(editingTransaction ? 'Transaction updated.' : 'Transaction added.')
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await transactionService.deleteTransaction(deletingTransaction.id)
      setDeletingTransaction(null)
      loadTransactions()
      showToast('Transaction deleted.')
    } catch (err) {
      showToast(getErrorMessage(err), 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const hasActiveFilters =
    filters.type || filters.category_id || filters.date_from || filters.date_to || filters.min_amount || filters.max_amount

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Every income, expense, and goal transfer in one place."
        action={
          <Button leftIcon={Plus} onClick={openCreateForm}>
            New transaction
          </Button>
        }
      />

      <Card className="mb-5" padded={false}>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search descriptions…"
              className="pl-9"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>

          <Select value={filters.type} onChange={(e) => updateFilter('type', e.target.value)} className="sm:w-40">
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
            <option value="transfer">Transfer</option>
          </Select>

          <div className="flex items-center gap-2">
            <Select value={filters.sort_by} onChange={(e) => updateFilter('sort_by', e.target.value)} className="w-36">
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  Sort: {opt.label}
                </option>
              ))}
            </Select>
            <button
              onClick={toggleSortOrder}
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label={`Sort ${filters.sort_order === 'desc' ? 'descending' : 'ascending'}`}
            >
              {filters.sort_order === 'desc' ? <ArrowDown size={15} /> : <ArrowUp size={15} />}
            </button>
          </div>

          <Button
            variant={hasActiveFilters ? 'outline' : 'secondary'}
            size="md"
            leftIcon={SlidersHorizontal}
            onClick={() => setShowMoreFilters((prev) => !prev)}
          >
            More filters
          </Button>
        </div>

        {showMoreFilters && (
          <div className="grid grid-cols-1 gap-3 border-t border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-2 lg:grid-cols-5">
            <Select
              label="Category"
              value={filters.category_id}
              onChange={(e) => updateFilter('category_id', e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input label="From date" type="date" value={filters.date_from} onChange={(e) => updateFilter('date_from', e.target.value)} />
            <Input label="To date" type="date" value={filters.date_to} onChange={(e) => updateFilter('date_to', e.target.value)} />
            <Input label="Min amount" type="number" min="0" step="0.01" value={filters.min_amount} onChange={(e) => updateFilter('min_amount', e.target.value)} />
            <Input label="Max amount" type="number" min="0" step="0.01" value={filters.max_amount} onChange={(e) => updateFilter('max_amount', e.target.value)} />
          </div>
        )}
      </Card>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <Spinner size={28} />
        </div>
      ) : error ? (
        <ErrorState description={error} onRetry={loadTransactions} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="No transactions found"
          description="Try adjusting your filters, or add your first transaction."
          action={
            <Button size="sm" leftIcon={Plus} onClick={openCreateForm}>
              New transaction
            </Button>
          }
        />
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((t) => (
                  <tr key={t.id} className="group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Badge color={TYPE_BADGE[t.type]} className="capitalize">
                          {t.type}
                        </Badge>
                        <span className="text-slate-700 dark:text-slate-300">
                          {t.description || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {t.category ? (
                        <div className="flex items-center gap-2">
                          <CategoryIcon icon={t.category.icon} color={t.category.color} size="sm" />
                          <span className="text-slate-600 dark:text-slate-400">{t.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Goal transfer</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                      {formatDate(t.transaction_date)}
                    </td>
                    <td className={`px-5 py-3.5 text-right font-medium ${TYPE_TEXT[t.type]}`}>
                      {TYPE_SIGN[t.type]}
                      {formatCurrency(t.amount, t.currency)}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => openEditForm(t)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                          aria-label="Edit transaction"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingTransaction(t)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                          aria-label="Delete transaction"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 pb-4">
            <Pagination page={meta.page} pages={meta.pages} total={meta.total} onPageChange={setPage} />
          </div>
        </Card>
      )}

      <TransactionFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleSaved}
        transaction={editingTransaction}
      />

      <ConfirmDialog
        isOpen={Boolean(deletingTransaction)}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleDelete}
        title="Delete transaction?"
        description="This action can't be undone. If this was a transfer, the linked goal's balance will be adjusted."
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  )
}
