'use client'
import { useState, useCallback } from 'react'

interface ToastProps {
  message: string
  visible: boolean
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50
                  px-6 py-3 rounded-full bg-ink text-white text-base font-medium
                  shadow-lg whitespace-nowrap transition-all duration-300
                  ${visible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-3 pointer-events-none'
                  }`}
    >
      {message}
    </div>
  )
}

export function useToast(duration = 2000) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  const show = useCallback((msg: string) => {
    setMessage(msg)
    setVisible(true)
    setTimeout(() => setVisible(false), duration)
  }, [duration])

  return { message, visible, show }
}
