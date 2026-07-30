import axios from 'axios'
import { getSession } from './auth.js'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://git-pipeline.metatronhost.in/tnnalavariyam/api',
})

api.interceptors.request.use((config) => {
  config.metadata = { startedAt: performance.now() }
  const token = getSession()?.token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

function readTimingHeader(headers, key) {
  const value = headers?.[key]
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function logApiTiming(responseOrError) {
  const config = responseOrError.config || responseOrError.response?.config
  const response = responseOrError.response || responseOrError
  const startedAt = config?.metadata?.startedAt
  if (!startedAt) return

  const clientTotalMs = Math.round((performance.now() - startedAt) * 100) / 100
  const serverProcessingTimeMs = readTimingHeader(response.headers, 'x-server-processing-time-ms')
    ?? readTimingHeader(response.headers, 'x-response-time-ms')
  const dbRoundTripTimeMs = readTimingHeader(response.headers, 'x-db-round-trip-time-ms')
    ?? readTimingHeader(response.headers, 'x-db-time-ms')
  const networkAndBrowserTimeMs = serverProcessingTimeMs === null
    ? null
    : Math.max(0, Math.round((clientTotalMs - serverProcessingTimeMs) * 100) / 100)

  console.info('[API timing]', {
    method: config.method?.toUpperCase(),
    url: `${config.baseURL || ''}${config.url || ''}`,
    status: response.status,
    clientTotalMs,
    serverProcessingTimeMs,
    dbRoundTripTimeMs,
    networkAndBrowserTimeMs,
  })
}

api.interceptors.response.use(
  (response) => {
    logApiTiming(response)
    return response
  },
  (error) => {
    logApiTiming(error)
    return Promise.reject(error)
  },
)
