import { useState, createContext, useContext, ReactNode } from 'react'
import { CheckCircle, XCircle, Info, Warning, X } from '@phosphor-icons/react'
import { clsx } from 'clsx'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

interface Notification {
  id: number
  type: NotificationType
  message: string
}

interface ConfirmOptions {
  title: string
  message: string
  onConfirm: () => void
}

interface NotificationContextType {
  notify: (type: NotificationType, message: string) => void
  askConfirm: (options: ConfirmOptions) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null)

  const notify = (type: NotificationType, message: string) => {
    const id = Date.now()
    setNotifications(prev => [...prev, { id, type, message }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }

  const askConfirm = (options: ConfirmOptions) => {
    setConfirmOptions(options)
  }

  const handleConfirm = () => {
    confirmOptions?.onConfirm()
    setConfirmOptions(null)
  }

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <NotificationContext.Provider value={{ notify, askConfirm }}>
      {children}
      
      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {notifications.map(n => (
          <div 
            key={n.id} 
            className={clsx(
              "pointer-events-auto flex items-center p-4 rounded-2xl shadow-2xl border animate-fadeIn min-w-[300px] max-w-md bg-white",
              n.type === 'success' && "border-green-100 text-green-800",
              n.type === 'error' && "border-red-100 text-red-800",
              n.type === 'info' && "border-blue-100 text-blue-800",
              n.type === 'warning' && "border-yellow-100 text-yellow-800"
            )}
          >
            <div className="mr-3">
              {n.type === 'success' && <CheckCircle size={24} weight="fill" className="text-green-500" />}
              {n.type === 'error' && <XCircle size={24} weight="fill" className="text-red-500" />}
              {n.type === 'info' && <Info size={24} weight="fill" className="text-blue-500" />}
              {n.type === 'warning' && <Warning size={24} weight="fill" className="text-yellow-500" />}
            </div>
            <p className="flex-1 text-sm font-bold">{n.message}</p>
            <button onClick={() => removeNotification(n.id)} className="ml-4 p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={16} weight="bold" className="text-gray-400" />
            </button>
          </div>
        ))}
      </div>

      {/* Internal Confirmation Modal */}
      {confirmOptions && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-70 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Warning size={32} weight="fill" />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tighter">{confirmOptions.title}</h3>
              <p className="text-gray-500 font-medium">{confirmOptions.message}</p>
            </div>
            <div className="p-6 bg-gray-50 flex gap-4">
              <button 
                onClick={() => setConfirmOptions(null)}
                className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-bold hover:bg-gray-100 transition-all uppercase text-xs tracking-widest"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-1 bg-red-500 text-white py-3 rounded-2xl font-bold hover:bg-red-600 shadow-lg shadow-red-100 transition-all uppercase text-xs tracking-widest"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}

export function useNotify() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotify must be used within NotificationProvider')
  return context.notify
}

export function useConfirm() {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useConfirm must be used within NotificationProvider')
  return context.askConfirm
}
