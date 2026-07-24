import api from './api'

export function listCategories(params) {
  return api.get('/categories', { params }).then((res) => res.data)
}

export function getCategory(id) {
  return api.get(`/categories/${id}`).then((res) => res.data)
}

export function createCategory(data) {
  return api.post('/categories', data).then((res) => res.data)
}

export function updateCategory(id, data) {
  return api.put(`/categories/${id}`, data).then((res) => res.data)
}

export function deleteCategory(id) {
  return api.delete(`/categories/${id}`)
}
