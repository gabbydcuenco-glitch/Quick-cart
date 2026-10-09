import { useEffect } from 'react'

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(onClose, toast.type === 'error' ? 9000 : 4500)
    return () => clearTimeout(timer)
  }, [toast, onClose])

  if (!toast) return null
  return (
    <div className={`toast toast-${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}>
      <span className="toast-icon" aria-hidden="true">{toast.type === 'error' ? '!' : '✓'}</span>
      <div className="toast-body">
        <strong>{toast.title}</strong>
        <p>{toast.message}</p>
        {toast.actionLabel && (
          <button type="button" className="btn btn-small btn-gold" onClick={() => { onClose(); toast.onAction() }}>
            {toast.actionLabel}
          </button>
        )}
      </div>
      <button type="button" className="toast-close" aria-label="Close message" onClick={onClose}>×</button>
    </div>
  )
}
