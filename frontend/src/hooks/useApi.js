import { useState } from 'react'

export function useApi(apiCall) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const execute = async (...args) => {
    setLoading(true)
    setError('')
    try {
      return await apiCall(...args)
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { execute, loading, error }
}
