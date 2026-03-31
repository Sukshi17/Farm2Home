import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Toaster position="top-right" toastOptions={{
      duration: 3000,
      style: { background: '#1e293b', color: '#f1f5f9', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }
    }} />
    <App />
  </React.StrictMode>,
)
