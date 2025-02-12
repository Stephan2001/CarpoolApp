import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import reportWebVitals from './reportWebVitals'

// Register service worker for background notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        '/service-worker.js'
      )
      console.log('Service Worker registered with scope:', registration.scope)

      // Wait until the service worker is fully activated and ready
      const swReady = await navigator.serviceWorker.ready
      console.log('Service Worker is ready:', swReady)
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  })
}

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App>
      <title>Varsity Carpool</title>
    </App>
  </React.StrictMode>
)

// Performance monitoring
reportWebVitals()
