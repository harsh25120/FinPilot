import api from './api'

export function register(data) {
  return api.post('/auth/register', data).then((res) => res.data)
}

export function login(email, password) {
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)
  return api
    .post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    .then((res) => res.data)
}

export function refreshAccessToken(refresh_token) {
  return api.post('/auth/refresh', { refresh_token }).then((res) => res.data)
}

export function logout(refresh_token) {
  return api.post('/auth/logout', { refresh_token })
}

export function getMe() {
  return api.get('/users/me').then((res) => res.data)
}

export function updateProfile(data) {
  return api.put('/users/me', data).then((res) => res.data)
}

export function changePassword(data) {
  return api.patch('/users/me/password', data)
}

export function deactivateAccount() {
  return api.delete('/users/me')
}
