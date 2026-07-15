import { createContext, useContext, useState, useCallback } from 'react'
import client from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rs_user')) } catch { return null }
  })

  const login = useCallback(async (email, password) => {
    const { data } = await client.post('/auth/login', { email, password })
    localStorage.setItem('rs_token', data.access_token)
    localStorage.setItem('rs_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (username, email, full_name, password) => {
    const { data } = await client.post('/auth/register', { username, email, full_name, password })
    localStorage.setItem('rs_token', data.access_token)
    localStorage.setItem('rs_user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('rs_token')
    localStorage.removeItem('rs_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
