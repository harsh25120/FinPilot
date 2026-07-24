import api from './api'

export function listGoals(params) {
  return api.get('/goals', { params }).then((res) => res.data)
}

export function getGoal(id) {
  return api.get(`/goals/${id}`).then((res) => res.data)
}

export function getGoalProgress(id) {
  return api.get(`/goals/${id}/progress`).then((res) => res.data)
}

export function createGoal(data) {
  return api.post('/goals', data).then((res) => res.data)
}

export function updateGoal(id, data) {
  return api.put(`/goals/${id}`, data).then((res) => res.data)
}

export function deleteGoal(id) {
  return api.delete(`/goals/${id}`)
}

export function contributeToGoal(id, data) {
  return api.post(`/goals/${id}/contribute`, data).then((res) => res.data)
}
