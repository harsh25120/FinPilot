import api from './api'

export function listBudgets(params) {
  return api.get('/budgets', { params }).then((res) => res.data)
}

export function getBudget(id) {
  return api.get(`/budgets/${id}`).then((res) => res.data)
}

export function getBudgetStatus(id) {
  return api.get(`/budgets/${id}/status`).then((res) => res.data)
}

export function getBudgetAlerts() {
  return api.get('/budgets/alerts').then((res) => res.data)
}

export function createBudget(data) {
  return api.post('/budgets', data).then((res) => res.data)
}

export function updateBudget(id, data) {
  return api.put(`/budgets/${id}`, data).then((res) => res.data)
}

export function deleteBudget(id) {
  return api.delete(`/budgets/${id}`)
}
