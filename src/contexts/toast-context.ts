import { createContext } from 'react'
import type { Toast, ToastType } from '../types/toast'

export interface ToastStateContextType {
  toasts: Toast[]
  addToast: (message: string, type: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastStateContextType | undefined>(undefined)
