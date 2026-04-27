import { useMemo, useState } from 'react'
import { clearToken, getToken, saveToken } from '../services/auth'
import { api } from '../services/api'

export function useAuth() {
  const [token, setToken] = useState(getToken())
  const [loading, setLoading] = useState(false)

  const login = async (username, password) => {
    setLoading(true)
    try {
      const data = await api.login({ username, password })
      saveToken(data.access_token)
      setToken(data.access_token)
      return true
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearToken()
    setToken(null)
  }

  return useMemo(() => ({ token, isAuthed: Boolean(token), login, logout, loading }), [token, loading])
}
