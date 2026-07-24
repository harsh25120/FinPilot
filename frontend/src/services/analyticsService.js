import api from './api'

export function getSpendingByCategory(params) {
  return api.get('/analytics/spending-by-category', { params }).then((res) => res.data)
}

export function getIncomeVsExpense(months = 6) {
  return api.get('/analytics/income-vs-expense', { params: { months } }).then((res) => res.data)
}

export function getSavingsRate(months = 6) {
  return api.get('/analytics/savings-rate', { params: { months } }).then((res) => res.data)
}

export function getTrends() {
  return api.get('/analytics/trends').then((res) => res.data)
}
