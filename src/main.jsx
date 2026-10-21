// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { markPlatformOnRoot } from './native'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import './app.css'

markPlatformOnRoot()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
