export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'SGD']

export const TRANSACTION_TYPES = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer to goal' },
]

export const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

export const GOAL_STATUSES = [
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export const SORT_OPTIONS = [
  { value: 'amount', label: 'Amount' },
  { value: 'created_at', label: 'Date added' },
]

// Matches the icon names FinPilot's backend seeds default categories with,
// plus a few extras available when creating a custom category.
export const CATEGORY_ICONS = [
  'briefcase',
  'laptop',
  'trending-up',
  'plus-circle',
  'shopping-cart',
  'home',
  'zap',
  'car',
  'coffee',
  'film',
  'heart',
  'shield',
  'shopping-bag',
  'book-open',
  'piggy-bank',
  'gift',
  'plane',
  'music',
  'dumbbell',
  'wallet',
  'phone',
  'wifi',
  'utensils',
  'graduation-cap',
  'star',
  'more-horizontal',
]

export const CATEGORY_COLORS = [
  '#22C55E',
  '#16A34A',
  '#0EA5E9',
  '#10B981',
  '#F97316',
  '#EF4444',
  '#F59E0B',
  '#6366F1',
  '#EC4899',
  '#8B5CF6',
  '#DC2626',
  '#0891B2',
  '#D946EF',
  '#2563EB',
  '#14B8A6',
  '#6B7280',
]

export const DEFAULT_PAGE_SIZE = 10
