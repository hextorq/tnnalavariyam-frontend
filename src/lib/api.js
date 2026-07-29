import axios from 'axios'
import { getSession } from './auth.js'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4001/api',
})

api.interceptors.request.use((config) => {
  const token = getSession()?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})
