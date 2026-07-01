import { useEffect, useRef, useState } from 'react'
import { ACCESS_CONFIG } from '../config.js'
import ExpiredScreen from './ExpiredScreen.jsx'

export default function AccessGate({ children }) {
  const [status, setStatus] = useState({ ready: false, allowed: false, reason: 'missing' })
  const gateRef = useRef({ expiresAt: 0, intervalId: null })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('share') || params.get('s')

    if (!token) {
      setStatus({ ready: true, allowed: false, reason: 'missing' })
      return undefined
    }

    const ttlRaw = parseInt(params.get('ttl') || '', 10)
    const ttlMinutes = Number.isFinite(ttlRaw) ? ttlRaw : ACCESS_CONFIG.defaultTtlMinutes
    const storageKey = `${ACCESS_CONFIG.storageKeyPrefix}${token}`

    const now = Date.now()
    let firstSeen = now

    try {
      const storedValue = localStorage.getItem(storageKey)

      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        if (parsed && parsed.firstSeen) {
          firstSeen = parsed.firstSeen
        }
      } else {
        localStorage.setItem(storageKey, JSON.stringify({ firstSeen }))
      }
    } catch {
      firstSeen = now
    }

    gateRef.current.expiresAt = firstSeen + ttlMinutes * 60 * 1000

    const checkAccess = () => {
      const expired = Date.now() >= gateRef.current.expiresAt
      setStatus({ ready: true, allowed: !expired, reason: expired ? 'expired' : 'active' })
    }

    checkAccess()
    gateRef.current.intervalId = window.setInterval(checkAccess, 5000)
    window.addEventListener('visibilitychange', checkAccess)
    window.addEventListener('focus', checkAccess)

    return () => {
      if (gateRef.current.intervalId) {
        clearInterval(gateRef.current.intervalId)
        gateRef.current.intervalId = null
      }

      window.removeEventListener('visibilitychange', checkAccess)
      window.removeEventListener('focus', checkAccess)
    }
  }, [])

  if (!status.ready) {
    return <div className="flex min-h-screen items-center justify-center bg-black text-white" />
  }

  if (!status.allowed) {
    return <ExpiredScreen reason={status.reason} />
  }

  return children
}
