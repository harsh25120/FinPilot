import { createContext, useCallback, useEffect, useState } from 'react'
import * as authService from '../services/authService'
import { clearTokens, getStoredTokens, storeTokens } from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // On first load, if we already have a token, fetch the current user so a
  // page refresh doesn't kick an already-logged-in person back to /login.
  const loadUser = useCallback(async () => {
    const { accessToken } = getStoredTokens()
    if (!accessToken) {
      setIsLoading(false)
      return
    }
    try {
      const me = await authService.getMe()
      setUser(me)
    } catch {
      clearTokens()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // The axios interceptor fires this when a refresh attempt fails, so we
  // stay in sync even if the failure happens outside a user-initiated action.
  useEffect(() => {
    function handleUnauthorized() {
      setUser(null)
    }
    window.addEventListener('finpilot:unauthorized', handleUnauthorized)
    return () => window.removeEventListener('finpilot:unauthorized', handleUnauthorized)
  }, [])

  async function login(email, password) {
    const tokens = await authService.login(email, password)
    storeTokens(tokens)
    const me = await authService.getMe()
    setUser(me)
    return me
  }

  async function register(data) {
    const tokens = await authService.register(data)
    storeTokens(tokens)
    const me = await authService.getMe()
    setUser(me)
    return me
  }

  async function logout() {
    const { refreshToken } = getStoredTokens()
    try {
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    } catch {
      // Best-effort: even if revoking server-side fails, still log out locally.
    } finally {
      clearTokens()
      setUser(null)
    }
  }

  function updateUser(updatedUser) {
    setUser(updatedUser)
  }

  const value = {
    user,
    isAuthenticated: Boolean(user),
    isLoading,
    login,
    register,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
