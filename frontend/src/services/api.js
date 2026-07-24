import axios from 'axios'
import { API_BASE_URL } from '../utils/constants'

const ACCESS_TOKEN_KEY = 'finpilot_access_token'
const REFRESH_TOKEN_KEY = 'finpilot_refresh_token'

export function getStoredTokens() {
  return {
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
  }
}

export function storeTokens({ access_token, refresh_token }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

const api = axios.create({ baseURL: API_BASE_URL })

// Attach the current access token to every outgoing request.
api.interceptors.request.use((config) => {
  const { accessToken } = getStoredTokens()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// Only one refresh call should ever be in flight, even if several requests
// 401 at the same moment (e.g. a page firing off multiple fetches at once).
let refreshPromise = null

function isAuthRoute(url = '') {
  return url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')
}

// On a 401 (and only once per request), try to refresh the access token and
// replay the original request. If refreshing also fails, clear stored
// tokens and notify the rest of the app so it can redirect to /login.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error

    if (!response || response.status !== 401 || isAuthRoute(config.url) || config._retried) {
      return Promise.reject(error)
    }

    const { refreshToken } = getStoredTokens()
    if (!refreshToken) {
      clearTokens()
      window.dispatchEvent(new Event('finpilot:unauthorized'))
      return Promise.reject(error)
    }

    config._retried = true

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
          .then((res) => res.data)
          .finally(() => {
            refreshPromise = null
          })
      }
      const tokens = await refreshPromise
      storeTokens(tokens)
      config.headers.Authorization = `Bearer ${tokens.access_token}`
      return api(config)
    } catch (refreshError) {
      clearTokens()
      window.dispatchEvent(new Event('finpilot:unauthorized'))
      return Promise.reject(refreshError)
    }
  }
)

export default api
