/**
 * Toast 轻量操作反馈
 * 原型阶段为死按钮 / mock 操作提供统一反馈通道。
 * 在 AppLayout 挂载 ToastProvider，页面通过 useToast() 调用。
 */
import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import Icon from './Icon'

const ToastContext = createContext(null)

let toastSeq = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    clearTimeout(timers.current[id])
    delete timers.current[id]
  }, [])

  const push = useCallback(
    (message, type = 'success') => {
      const id = ++toastSeq
      setToasts((list) => [...list, { id, message, type }])
      timers.current[id] = setTimeout(() => dismiss(id), 3200)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type === 'error' ? 'error' : ''}`.trim()}>
            <Icon name={t.type === 'error' ? AlertCircle : CheckCircle2} size={16} />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

/** @returns {(message: string, type?: 'success' | 'error') => void} */
export function useToast() {
  return useContext(ToastContext)
}
