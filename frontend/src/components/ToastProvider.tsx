import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

type ToastPayload = {
  title: string
  message?: string
}

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider(props: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastPayload | null>(null)

  const showToast = useCallback((payload: ToastPayload) => {
    setToast(payload)
    window.setTimeout(() => setToast(null), 4200)
  }, [])

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {props.children}
      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          <p className="toastTitle">{toast.title}</p>
          {toast.message ? <p className="toastBody">{toast.message}</p> : null}
        </div>
      ) : null}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

