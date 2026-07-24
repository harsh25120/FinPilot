import api from './api'

export function getOverview() {
  return api.get('/dashboard/overview').then((res) => res.data)
}

export function getCashFlow(months = 6) {
  return api.get('/dashboard/cash-flow', { params: { months } }).then((res) => res.data)
}
