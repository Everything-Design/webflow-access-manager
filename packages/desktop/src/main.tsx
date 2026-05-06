import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/globals.css'

// Wrap everything in try-catch to surface any crash
try {
  console.log('[main] Starting React app...')

  // Dynamic import to catch module-level errors
  import('./App').then(({ App }) => {
    console.log('[main] App module loaded, mounting React...')
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
    console.log('[main] React mounted successfully')
  }).catch((err) => {
    console.error('[main] Failed to load App module:', err)
    document.getElementById('root')!.innerHTML = `
      <div style="padding:20px;color:#ff3b30;font-family:system-ui;font-size:13px;">
        <h3>App failed to load</h3>
        <pre style="white-space:pre-wrap;margin-top:8px;">${err?.message || err}</pre>
        <pre style="white-space:pre-wrap;margin-top:4px;color:#86868b;font-size:11px;">${err?.stack || ''}</pre>
      </div>
    `
  })
} catch (err) {
  console.error('[main] Critical error:', err)
}
