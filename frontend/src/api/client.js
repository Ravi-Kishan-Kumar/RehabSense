import axios from 'axios'

const client = axios.create({ baseURL: '/api' })

// Attach JWT token automatically
client.interceptors.request.use(cfg => {
  const token = localStorage.getItem('rs_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Global 401 handler
client.interceptors.response.use(
  res => res,
  err => {
    const url = err.config?.url || ''
    const isAuthSubmit = url.includes('/auth/login') || url.includes('/auth/register')
    if (err.response?.status === 401 && !isAuthSubmit) {
      localStorage.removeItem('rs_token')
      localStorage.removeItem('rs_user')
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

export default client
