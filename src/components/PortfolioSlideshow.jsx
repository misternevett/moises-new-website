import { useEffect, useRef, useState } from 'react'
import { portfolioSlides } from '../data/portfolioSlides.js'

const SLIDES = portfolioSlides

const HOTSPOT_DEBUG_ENABLED =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('hotspots') === 'debug'

const PORTFOLIO_HOTSPOTS = {
  'D_2.mp4': [
    { id: 'rabanne', targetAsset: 'D_7.mp4', rect: { left: 8, top: 33.5, width: 33, height: 4 } },
    { id: 'zegna', targetAsset: 'D_33.mp4', rect: { left: 8, top: 38, width: 33, height: 4 } },
    { id: 'gucci-vault', targetAsset: 'D_26.mp4', rect: { left: 8, top: 65, width: 33, height: 4 } },
    { id: 'coach', targetAsset: 'D_14.mp4', rect: { left: 8, top: 69.5, width: 33, height: 4 } },
    { id: 'burberry', targetAsset: 'D_40.mp4', rect: { left: 8, top: 78.5, width: 33, height: 4 } },
    { id: 'mclaren', targetAsset: 'D_47.mp4', rect: { left: 56, top: 33.5, width: 34, height: 4 } },
  ],
  'D_3.mp4': [
    { id: 'ounass', targetAsset: 'D_21.mp4', rect: { left: 8, top: 56, width: 33, height: 4 } },
  ],
  'D_50.mp4': [
    {
      id: 'email',
      copy: 'moisesnevett@gmail.com',
      toast: 'Email copied',
      toastDuration: 1700,
      label: 'Email',
      rect: { left: 83.5, top: 68.5, width: 12, height: 1.2 },
    },
    {
      id: 'phone',
      copy: '+447580751398',
      toast: 'Phone number copied',
      toastDuration: 1700,
      label: 'Phone',
      rect: { left: 83.5, top: 70.6, width: 12, height: 1.2 },
    },
    {
      id: 'linkedin',
      href: 'https://www.linkedin.com/in/moises-nevett-galvan/',
      label: 'LinkedIn',
      rect: { left: 83.5, top: 73, width: 7, height: 1.2 },
    },
    {
      id: 'instagram',
      href: 'https://www.instagram.com/moisesnevett/',
      label: 'Instagram',
      rect: { left: 83.5, top: 75, width: 7, height: 1.3 },
    },
  ],
}

function getAssetFilename(src) {
  return src.split('/').pop() || ''
}

function shouldIgnorePortfolioShortcut(target) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true

  return Boolean(
    target.closest('input, textarea, select, button, [contenteditable="true"]'),
  )
}

export default function PortfolioSlideshow({ onClose }) {
  const [index, setIndex] = useHashIndex(0, SLIDES.length - 1)
  const [showUI, setShowUI] = useState(true)
  const [uiIdleHidden, setUiIdleHidden] = useState(false)
  const uiIdleTimer = useRef(null)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [cursorVisible, setCursorVisible] = useState(true)
  const cursorTimer = useRef(null)
  const [overHotspot, setOverHotspot] = useState(false)
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const { prefetch } = useSmartPreload(SLIDES, index)

  const UI_IDLE_MS = 5000
  const UI_FADE_MS = 300
  const CURSOR_IDLE_MS = 5000
  const CURSOR_FADE_MS = 300
  const currentAssetFilename = getAssetFilename(SLIDES[index]?.src || '')
  const hotspots = PORTFOLIO_HOTSPOTS[currentAssetFilename] || []

  const goToPortfolioAsset = (targetAssetFilename) => {
    const targetIndex = SLIDES.findIndex((slide) => slide.src.endsWith(`/${targetAssetFilename}`))

    if (targetIndex === -1) {
      console.warn(`Portfolio target asset not found: ${targetAssetFilename}`)
      showToast('Slide unavailable')
      return
    }

    setIndex(targetIndex)
  }

  const showToast = (message, duration = 1200) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), duration)
  }

  useEffect(() => {
    const onKey = (event) => {
      if (shouldIgnorePortfolioShortcut(event.target)) return

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      } else if (event.key.toLowerCase() === 'f' || event.key === 'Home') {
        event.preventDefault()
        goTo(0)
      } else if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const resetUiIdle = () => {
      if (!showUI) return
      setUiIdleHidden(false)
      if (uiIdleTimer.current) clearTimeout(uiIdleTimer.current)
      uiIdleTimer.current = setTimeout(() => setUiIdleHidden(true), UI_IDLE_MS)
    }

    resetUiIdle()
    window.addEventListener('mousemove', resetUiIdle)
    window.addEventListener('touchstart', resetUiIdle, { passive: true })

    return () => {
      window.removeEventListener('mousemove', resetUiIdle)
      window.removeEventListener('touchstart', resetUiIdle)
      if (uiIdleTimer.current) clearTimeout(uiIdleTimer.current)
    }
  }, [showUI, index])

  useEffect(() => {
    const onMove = (event) => {
      const x = 'clientX' in event ? event.clientX : event.touches?.[0]?.clientX ?? 0
      const y = 'clientY' in event ? event.clientY : event.touches?.[0]?.clientY ?? 0

      setCursorPos({ x, y })
      setCursorVisible(true)
      if (cursorTimer.current) clearTimeout(cursorTimer.current)
      cursorTimer.current = setTimeout(() => setCursorVisible(false), CURSOR_IDLE_MS)
    }

    if (cursorTimer.current) clearTimeout(cursorTimer.current)
    cursorTimer.current = setTimeout(() => setCursorVisible(false), CURSOR_IDLE_MS)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchstart', onMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchstart', onMove)
      if (cursorTimer.current) clearTimeout(cursorTimer.current)
    }
  }, [index])

  useEffect(() => {
    setOverHotspot(false)
  }, [index])

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const goTo = (targetIndex) => setIndex(clamp(targetIndex, 0, SLIDES.length - 1))
  const goNext = () => setIndex((current) => clamp(current + 1, 0, SLIDES.length - 1))
  const goPrev = () => setIndex((current) => clamp(current - 1, 0, SLIDES.length - 1))

  const uiVisible = showUI && !uiIdleHidden

  return (
    <div className={`h-screen w-screen overflow-hidden bg-black text-white select-none ${!overHotspot ? 'cursor-none' : ''}`}>
      {!overHotspot && (
        <>
          <button
            aria-label={index === 0 ? 'Next' : 'Previous'}
            onClick={index === 0 ? goNext : goPrev}
            className="fixed inset-y-0 left-0 z-10 w-1/2 focus:outline-none"
            style={{ background: 'transparent', cursor: 'none' }}
          />
          <button
            aria-label="Next"
            onClick={goNext}
            className="fixed inset-y-0 right-0 z-10 w-1/2 focus:outline-none"
            style={{ background: 'transparent', cursor: 'none' }}
          />
          {index === SLIDES.length - 1 && (
            <button
              aria-label="Restart"
              onClick={() => goTo(0)}
              className="fixed inset-0 z-20 focus:outline-none"
              style={{ background: 'transparent', cursor: 'none' }}
            />
          )}
        </>
      )}

      <div className="relative flex h-full w-full items-center justify-center">
        <MediaSlide
          slide={SLIDES[index]}
          hotspots={hotspots}
          onSelect={goTo}
          onSelectAsset={goToPortfolioAsset}
          onToast={showToast}
          onHotspotHover={setOverHotspot}
          onPrefetch={prefetch}
          debugHotspots={HOTSPOT_DEBUG_ENABLED}
        />
      </div>

      <div
        className={`absolute bottom-0 left-0 right-0 flex items-end justify-between p-3 md:p-4 transition-opacity ${
          uiVisible ? 'pointer-events-auto opacity-80' : 'pointer-events-none opacity-0'
        }`}
        style={{ fontSize: '9px', transitionDuration: `${UI_FADE_MS}ms` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-300/80">Slide {index + 1} / {SLIDES.length}</span>
        </div>
        <div className="hidden gap-3 text-gray-300/80 md:flex">
          <span>&larr;/&rarr; navigate</span>
          <span>F = first</span>
          <span>Esc = close overlay</span>
        </div>
      </div>

      {!overHotspot && (
        <CursorGhost
          x={cursorPos.x}
          y={cursorPos.y}
          variant={
            index === SLIDES.length - 1
              ? 'reload'
              : index === 0
                ? 'next'
                : cursorPos.x < window.innerWidth / 2
                  ? 'prev'
                  : 'next'
          }
          visible={cursorVisible}
          fadeMs={CURSOR_FADE_MS}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 z-[110] rounded-md bg-black/70 px-3 py-2 text-xs text-white transition-opacity duration-300">
          {toast}
        </div>
      )}
    </div>
  )
}

function MediaSlide({
  slide,
  hotspots = [],
  onSelect,
  onSelectAsset,
  onToast,
  onHotspotHover,
  onPrefetch,
  debugHotspots = false,
}) {
  const [loading, setLoading] = useState(true)
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    setLoading(true)
    setShowLoader(false)
    const timer = setTimeout(() => setShowLoader(true), 200)
    return () => clearTimeout(timer)
  }, [slide?.src])

  useEffect(() => () => {
    if (onHotspotHover) onHotspotHover(false)
  }, [onHotspotHover])

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black">
      <div className="relative inline-flex max-h-full max-w-full items-center justify-center">
        {slide.type === 'image' ? (
          <img
            src={slide.src}
            alt={slide.alt || ''}
            className="block max-h-full max-w-full select-none object-contain"
            draggable={false}
            onLoad={() => setLoading(false)}
          />
        ) : (
          <video
            src={slide.src}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="block max-h-full max-w-full object-contain"
            onLoadedData={() => setLoading(false)}
          />
        )}

        {hotspots.length > 0 && (
          <div className="pointer-events-none absolute inset-0 z-30">
          {hotspots.map((hotspot, index) => (
            <button
              key={hotspot.id || index}
              type="button"
              onClick={() => {
                if (hotspot.targetAsset) {
                  onSelectAsset?.(hotspot.targetAsset)
                } else if (hotspot.href) {
                  window.open(hotspot.href, '_blank', 'noopener,noreferrer')
                  onToast?.(hotspot.label || 'Opening...')
                } else if (hotspot.copy) {
                  const text = String(hotspot.copy)
                  const done = () => onToast?.(hotspot.toast || 'Copied!', hotspot.toastDuration)

                  if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(text).then(done).catch(() => {
                      onToast?.('Copy failed', hotspot.toastDuration)
                    })
                  } else {
                    const textarea = document.createElement('textarea')
                    textarea.value = text
                    textarea.style.position = 'fixed'
                    textarea.style.opacity = '0'
                    document.body.appendChild(textarea)
                    textarea.focus()
                    textarea.select()
                    try {
                      document.execCommand('copy')
                    } catch {
                      // noop
                    }
                    document.body.removeChild(textarea)
                    done()
                  }
                }
              }}
              onMouseEnter={() => {
                onHotspotHover?.(true)
                if (hotspot.targetAsset && onPrefetch) {
                  const targetIndex = SLIDES.findIndex((candidate) =>
                    candidate.src.endsWith(`/${hotspot.targetAsset}`),
                  )
                  if (targetIndex >= 0) {
                    onPrefetch(targetIndex)
                    onPrefetch(targetIndex + 1)
                    onPrefetch(targetIndex - 1)
                  }
                }
              }}
              onMouseLeave={() => onHotspotHover?.(false)}
              className="absolute pointer-events-auto cursor-pointer"
              aria-label={hotspot.label || (hotspot.targetAsset ? `Go to ${hotspot.targetAsset}` : 'Open')}
              style={{
                left: `${hotspot.rect.left}%`,
                top: `${hotspot.rect.top}%`,
                width: `${hotspot.rect.width}%`,
                height: `${hotspot.rect.height}%`,
                background: debugHotspots ? 'rgba(255, 184, 0, 0.18)' : 'transparent',
                border: debugHotspots ? '1px solid rgba(255, 184, 0, 0.65)' : 'none',
              }}
            >
              {debugHotspots ? (
                <span className="pointer-events-none absolute left-1 top-1 rounded bg-black/75 px-1.5 py-0.5 text-[10px] leading-none text-white">
                  {hotspot.id} {'->'} {hotspot.targetAsset || hotspot.label}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        )}
      </div>

      {loading && showLoader && <ClockLoader />}
    </div>
  )
}

function CursorGhost({ x, y, variant, visible, fadeMs = 300 }) {
  const size = 32
  const offset =
    variant === 'prev'
      ? { x: -size * 0.25, y: -size * 0.5 }
      : variant === 'next'
        ? { x: -size * 0.75, y: -size * 0.5 }
        : { x: -size * 0.5, y: -size * 0.5 }

  const src =
    variant === 'reload'
      ? '/cursors/reload.svg'
      : variant === 'prev'
        ? '/cursors/left.svg'
        : '/cursors/right.svg'

  return (
    <div
      className="pointer-events-none fixed z-[70] transition-opacity"
      style={{
        transform: `translate(${x + offset.x}px, ${y + offset.y}px)`,
        width: size,
        height: size,
        backgroundImage: `url('${src}')`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        opacity: visible ? 1 : 0,
        transitionDuration: `${fadeMs}ms`,
        left: 0,
        top: 0,
      }}
    />
  )
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function useHashIndex(initial, max) {
  const [index, setIndex] = useState(() => {
    const match = window.location.hash.match(/^#(?:\/|portfolio\/)(\d+)$/)
    const start = match ? parseInt(match[1], 10) : initial
    return clamp(start, 0, max)
  })

  useEffect(() => {
    const onHash = () => {
      const match = window.location.hash.match(/^#(?:\/|portfolio\/)(\d+)$/)
      if (match) {
        setIndex(clamp(parseInt(match[1], 10), 0, max))
      }
    }

    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [max])

  useEffect(() => {
    const desired = `#/${index}`
    if (window.location.hash !== desired) window.location.hash = desired
  }, [index])

  return [index, setIndex]
}

function useSmartPreload(slides, index) {
  const cacheRef = useRef({})
  const queuedRef = useRef(new Set())
  const queueRef = useRef([])
  const inflightRef = useRef(0)
  const maxRef = useRef(2)

  useEffect(() => {
    try {
      const connection = navigator.connection
      const slow = connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g' || connection.saveData)
      maxRef.current = slow ? 1 : 3
    } catch {
      maxRef.current = 2
    }
  }, [])

  const inBounds = (slideIndex) => slideIndex >= 0 && slideIndex < slides.length

  const warmSrc = (src, priority = false) => {
    if (cacheRef.current[src]) return
    cacheRef.current[src] = true

    try {
      const link = document.createElement('link')
      link.rel = priority ? 'preload' : 'prefetch'
      if (priority) link.as = 'video'
      link.href = src
      document.head.appendChild(link)
    } catch {
      // noop
    }

    const video = document.createElement('video')
    video.preload = priority ? 'auto' : 'metadata'
    video.muted = true
    video.src = src
    const cleanup = () => {
      video.removeAttribute('src')
      video.load()
    }
    video.addEventListener('loadeddata', cleanup, { once: true })
    video.addEventListener('error', cleanup, { once: true })
    try {
      video.load()
    } catch {
      // noop
    }
  }

  const pump = (urgent = false) => {
    if (document.hidden) return

    while (inflightRef.current < maxRef.current && queueRef.current.length > 0) {
      const slideIndex = queueRef.current.shift()
      const slide = slides[slideIndex]
      if (!slide || cacheRef.current[slide.src]) continue

      inflightRef.current += 1
      const start = () => {
        warmSrc(slide.src, false)
        inflightRef.current -= 1
        if (queueRef.current.length) pump()
      }

      if ('requestIdleCallback' in window && !urgent) {
        window.requestIdleCallback(start, { timeout: 1200 })
      } else {
        setTimeout(start, 0)
      }
    }
  }

  const enqueueBack = (slideIndex) => {
    if (!inBounds(slideIndex) || queuedRef.current.has(slideIndex)) return
    queuedRef.current.add(slideIndex)
    queueRef.current.push(slideIndex)
    pump()
  }

  const enqueueFront = (slideIndex) => {
    if (!inBounds(slideIndex) || queuedRef.current.has(slideIndex)) return
    queuedRef.current.add(slideIndex)
    queueRef.current.unshift(slideIndex)
    pump(true)
  }

  const prefetch = (slideIndex) => {
    if (!inBounds(slideIndex)) return
    const slide = slides[slideIndex]
    if (!slide || cacheRef.current[slide.src]) return

    warmSrc(slide.src, true)
    if (inBounds(slideIndex + 1)) enqueueFront(slideIndex + 1)
    if (inBounds(slideIndex - 1)) enqueueFront(slideIndex - 1)
  }

  useEffect(() => {
    const connection = navigator.connection
    const slow = Boolean(connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g' || connection.saveData))
    const ahead = slow ? 2 : 4

    if (inBounds(index + 1)) warmSrc(slides[index + 1].src, true)
    if (inBounds(index + 2)) warmSrc(slides[index + 2].src, true)
    if (inBounds(index - 1)) enqueueFront(index - 1)

    for (let distance = 3; distance <= ahead; distance += 1) {
      enqueueBack(index + distance)
    }

    pump()
  }, [index, slides])

  useEffect(() => {
    for (let slideIndex = index + 5; slideIndex < slides.length; slideIndex += 1) {
      enqueueBack(slideIndex)
    }

    for (let slideIndex = 0; slideIndex < index - 2; slideIndex += 1) {
      enqueueBack(slideIndex)
    }

    pump()
  }, [index, slides])

  return { prefetch }
}
