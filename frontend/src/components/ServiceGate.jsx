import { useEffect, useState } from 'react'
import { servicesAvailable } from '../service-health'

export default function ServiceGate({ children }) {
  const [ready, setReady] = useState(null)
  useEffect(() => {
    let active = true
    let timer
    let generation = 0
    const check = async () => {
      clearTimeout(timer)
      const current = ++generation
      const available = await servicesAvailable()
      if (!active || current !== generation) return
      setReady(available)
      timer = setTimeout(check, 3000)
    }
    const recheck = () => { setReady(null); void check() }
    const offline = () => {
      ++generation
      clearTimeout(timer)
      setReady(false)
      timer = setTimeout(check, 3000)
    }
    const visible = () => {
      if (document.visibilityState === 'visible') recheck()
    }
    void check()
    window.addEventListener('online', recheck)
    window.addEventListener('offline', offline)
    window.addEventListener('pageshow', recheck)
    window.addEventListener('quickcart:unavailable', offline)
    document.addEventListener('visibilitychange', visible)
    return () => {
      active = false
      ++generation
      clearTimeout(timer)
      window.removeEventListener('online', recheck)
      window.removeEventListener('offline', offline)
      window.removeEventListener('pageshow', recheck)
      window.removeEventListener('quickcart:unavailable', offline)
      document.removeEventListener('visibilitychange', visible)
    }
  }, [])

  if (ready) return children
  return (
    <main className="section" aria-live="polite">
      <h1 className="page-title">{ready === null ? 'Opening QuickCart…' : 'QuickCart is currently unavailable'}</h1>
      <p className="notice">{ready === null ? 'Checking store availability.' : 'The store connection was lost. This page will reconnect automatically when service returns.'}</p>
    </main>
  )
}
