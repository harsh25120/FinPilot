import api from './api'

export function listTransactions(params) {
  return api.get('/transactions', { params }).then((res) => res.data)
}

export function getTransaction(id) {
  return api.get(`/transactions/${id}`).then((res) => res.data)
}

export function createTransaction(data) {
  return api.post('/transactions', data).then((res) => res.data)
}

export function updateTransaction(id, data) {
  return api.put(`/transactions/${id}`, data).then((res) => res.data)
}

export function deleteTransaction(id) {
  return api.delete(`/transactions/${id}`)
}
