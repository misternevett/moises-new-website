import { useEffect, useRef, useState } from 'react'
import PortfolioSlideshow from './PortfolioSlideshow.jsx'

const CLOSE_IDLE_MS = 8000
const TOP_HOVER_RATIO = 0.18

export default function PortfolioOverlay({ onClose }) {
  const [closeVisible, setCloseVisible] = useState(true)
  const idleTimerRef = useRef(null)
  const closeVisibleRef = useRef(true)

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }

  const showCloseButton = () => {
    closeVisibleRef.current = true
    setCloseVisible(true)
    clearIdleTimer()
    idleTimerRef.current = setTimeout(() => {
      closeVisibleRef.current = false
      setCloseVisible(false)
      idleTimerRef.current = null
    }, CLOSE_IDLE_MS)
  }

  useEffect(() => {
    showCloseButton()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
        return
      }

      showCloseButton()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      clearIdleTimer()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[90] bg-black"
      onMouseMove={(event) => {
        if (window.innerWidth < 768) return

        if (closeVisibleRef.current || event.clientY <= window.innerHeight * TOP_HOVER_RATIO) {
          showCloseButton()
        }
      }}
      onClick={() => showCloseButton()}
      onTouchStart={() => showCloseButton()}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onClose?.()
        }}
        className={`fixed right-5 top-5 z-[140] transition-opacity duration-300 ${
          closeVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Close portfolio"
      >
        <img
          src="/icons/close-button.png"
          alt=""
          className="block select-none object-contain"
          style={{ width: '28px', height: '28px' }}
          draggable={false}
        />
      </button>

      <PortfolioSlideshow onClose={onClose} />
    </div>
  )
}
