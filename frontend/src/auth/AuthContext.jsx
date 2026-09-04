/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

const API_BASE_URL = import.meta.env.VITE_BACKENDURL || 'http://localhost:8080/api/'
const CHECK_AUTH_URL = `${API_BASE_URL.replace(/\/$/, '')}/checkauth`

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isMounted = true

    const verifySession = async () => {
      try {
        const response = await fetch(CHECK_AUTH_URL, {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Session invalid')
        }

        if (isMounted) {
          setStatus('authenticated')
        }
      } catch {
        if (isMounted) {
          setStatus('unauthenticated')
        }
      }
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [])

  const markAuthenticated = () => {
    setStatus('authenticated')
  }

  const logout = () => {
    setStatus('unauthenticated')
  }

  const value = {
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    markAuthenticated,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

export function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="route-status">Checking your session...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return children
}

export function RequireGuest({ children }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className="route-status">Checking your session...</div>
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}