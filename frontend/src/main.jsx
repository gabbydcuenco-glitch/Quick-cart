import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './App.css'
import './pastel-theme.css'
import App from './App.jsx'
import ServiceGate from './components/ServiceGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ServiceGate><App /></ServiceGate>
  </StrictMode>,
)
