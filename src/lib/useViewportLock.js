// Locks the viewport scale while a component is mounted (prevents iOS zoom on inputs)
import { useEffect } from "react"

export function useViewportLock() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]')
    if (!meta) return

    const prev = meta.getAttribute('content') || 'width=device-width, initial-scale=1, viewport-fit=cover'

    // Add scale locks only if not already present
    const hasMax = /maximum-scale=/.test(prev)
    const hasUser = /user-scalable=/.test(prev)

    const next =
      prev +
      (hasMax ? '' : ', maximum-scale=1') +
      (hasUser ? '' : ', user-scalable=no')

    meta.setAttribute('content', next)

    // cleanup: restore previous viewport when we leave the page
    return () => meta.setAttribute('content', prev)
  }, [])
}
