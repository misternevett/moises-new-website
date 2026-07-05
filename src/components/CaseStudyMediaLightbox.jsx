import { useCallback, useEffect, useRef, useState } from 'react'
import { assetUrl } from '../utils/assetUrl.js'

const LIGHTBOX_EXIT_MS = 220
const LIGHTBOX_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

function LightboxMedia({ media }) {
  if (media.mediaType === 'video') {
    return (
      <video
        key={media.src}
        src={media.src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="max-h-[100vh] max-w-[100vw] object-contain"
      />
    )
  }

  return (
    <img
      src={media.src}
      alt={media.alt || ''}
      className="max-h-[100vh] max-w-[100vw] object-contain"
      draggable={false}
    />
  )
}

export default function CaseStudyMediaLightbox({ media, onClose }) {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const closeTimerRef = useRef(null)
  const isClosingRef = useRef(false)

  const requestClose = useCallback(() => {
    if (isClosingRef.current) {
      return
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      isClosingRef.current = true
      onClose?.()
      return
    }

    isClosingRef.current = true
    setIsClosing(true)
    setIsVisible(false)

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
    }

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      onClose?.()
    }, LIGHTBOX_EXIT_MS)
  }, [onClose])

  useEffect(() => {
    isClosingRef.current = false
    const openFrame = window.requestAnimationFrame(() => {
      setIsVisible(true)
    })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        requestClose()
      }
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => {
      window.cancelAnimationFrame(openFrame)
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      window.removeEventListener('keydown', onKeyDown, true)
      isClosingRef.current = false
    }
  }, [requestClose])

  if (!media?.src) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 z-[170] transition-opacity duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible && !isClosing ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      onClick={requestClose}
    >
      <div className="absolute inset-0 bg-black/80" />

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          requestClose()
        }}
        className={`fixed right-4 top-4 z-[180] flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-[220ms] md:right-6 md:top-6 ${
          isVisible && !isClosing ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        }`}
        style={{ transitionTimingFunction: LIGHTBOX_EASE }}
        aria-label="Close fullscreen media"
      >
        <img
          src={assetUrl('/icons/close-button.png')}
          alt=""
          className="block h-5 w-5 select-none object-contain"
          draggable={false}
        />
      </button>

      <div className="relative flex h-full w-full items-center justify-center p-4 md:p-6">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            requestClose()
          }}
          className={`max-h-full max-w-full cursor-pointer bg-transparent p-0 transition-[opacity,transform] duration-[220ms] ${
            isVisible && !isClosing ? 'scale-100 opacity-100' : 'scale-[0.985] opacity-0'
          }`}
          style={{ transitionTimingFunction: LIGHTBOX_EASE }}
          aria-label="Close fullscreen media"
        >
          <LightboxMedia media={media} />
        </button>
      </div>
    </div>
  )
}
