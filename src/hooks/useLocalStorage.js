'use client'

import { useCallback, useState } from 'react'

export function useLocalStorage (key, initialValue) {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') return initialValue
    try {
      const raw = window.localStorage.getItem(key)
      return raw != null ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (valueOrUpdater) => {
      setState((prev) => {
        const next =
          typeof valueOrUpdater === 'function'
            ? valueOrUpdater(prev)
            : valueOrUpdater
        try {
          window.localStorage.setItem(key, JSON.stringify(next))
        } catch {
        }
        return next
      })
    },
    [key]
  )

  return [state, setValue]
}
