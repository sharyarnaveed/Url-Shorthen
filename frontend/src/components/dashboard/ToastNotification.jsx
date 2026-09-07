import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export function ToastNotification({ toast }) {
  if (!toast) return null

  return (
    <div className={`dash-toast dash-toast--${toast.type}`}>
      <span className="dash-toast-icon">
        {toast.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
      </span>
      <span>{toast.message}</span>
    </div>
  )
}

export default ToastNotification
