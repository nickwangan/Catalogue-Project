import { createContext, useCallback, useContext, useState } from 'react'

type ToastVariant = 'success' | 'error'

type Toast = {
  id: number
  message: string
  variant: ToastVariant
}

type ToastContextType = {
  showToast: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let nextId = 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = nextId++
    setToasts(prev => [...prev, { id, message, variant }])
    // Auto-dismiss after 2.5s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg text-white text-sm font-medium animate-fade-in ${
              t.variant === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
            style={{ animation: 'fadeIn 200ms ease-out' }}
          >
            <span className="text-lg leading-none">
              {t.variant === 'success' ? '✓' : '⚠'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
