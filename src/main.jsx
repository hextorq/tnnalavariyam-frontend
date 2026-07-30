import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ApiLoadingOverlay from './components/ApiLoadingOverlay.jsx'
import { NotificationsProvider } from './components/Notifications.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationsProvider>
      <App />
      <ApiLoadingOverlay />
    </NotificationsProvider>
  </StrictMode>,
)
