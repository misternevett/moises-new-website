import { useEffect, useRef, useState } from 'react'

const SLIDES = [
  ...Array.from({ length: 54 }, (_, i) => ({
    type: 'video',
    src: `/slides/D_${i + 1}.mp4`,
    alt: `D_${i + 1}`,
  })),
]

const HOTSPOTS = {
  0: [
    { to: 1, x: 74, y: 7, w: 8, h: 6, label: 'Work', debug: false },
    { to: 49, x: 82, y: 7, w: 8, h: 6, label: 'About', debug: false },
    { to: 50, x: 90, y: 7, w: 8, h: 6, label: 'Contact', debug: false },
    { copy: 'moisesnevett@gmail.com', x: 5, y: 92, w: 18, h: 3, label: 'Copy Email', toast: 'Email copied', debug: false },
    { overlay: 'showreel', x: 75, y: 74, w: 22, h: 26, label: 'Workreel', debug: false },
  ],
  1: [
    { to: 6, x: 8, y: 20, w: 30, h: 4, label: 'Rabanne', debug: false },
    { to: 32, x: 8, y: 25, w: 30, h: 3, label: 'Zegna', debug: false },
    { to: 25, x: 7.5, y: 52, w: 32, h: 3, label: 'Gucci Vault', debug: false },
    { to: 13, x: 8, y: 56, w: 32, h: 3, label: 'Coach', debug: false },
    { to: 39, x: 8, y: 64, w: 30, h: 4, label: 'Burberry', debug: false },
    { to: 46, x: 58, y: 20, w: 33, h: 4, label: 'McLaren', debug: false },
  ],
  2: [
    { to: 20, x: 8, y: 42, w: 33, h: 4, label: 'To Slide 21', debug: false },
  ],
  49: [
    { copy: 'moisesnevett@gmail.com', x: 83.5, y: 68.5, w: 12, h: 1.2, label: 'Copy Email', toast: 'Email copied', debug: false },
    { copy: '00447580751398', x: 83.5, y: 70.6, w: 12, h: 1.2, label: 'Copy Phone', toast: 'Phone copied', debug: false },
    { href: 'https://www.linkedin.com/in/moises-nevett-4b8ba62/', x: 83.5, y: 73, w: 7, h: 1.2, label: 'LinkedIn', debug: false },
    { href: 'https://www.instagram.com/moisesnevett/', x: 83.5, y: 75, w: 7, h: 1.3, label: 'Instagram', debug: false },
  ],
  50: [
    { copy: 'moisesnevett@gmail.com', x: 83.5, y: 68.5, w: 12, h: 1.2, label: 'Copy Email', toast: 'Email copied', debug: false },
    { copy: '00447580751398', x: 83.5, y: 70.6, w: 12, h: 1.2, label: 'Copy Phone', toast: 'Phone copied', debug: false },
    { href: 'https://www.linkedin.com/in/moises-nevett-4b8ba62/', x: 83.5, y: 73, w: 7, h: 1.2, label: 'LinkedIn', debug: false },
    { href: 'https://www.instagram.com/moisesnevett/', x: 83.5, y: 75, w: 7, h: 1.3, label: 'Instagram', debug: false },
  ],
  51: [
    { copy: 'moisesnevett@gmail.com', x: 83.5, y: 68.5, w: 12, h: 1.2, label: 'Copy Email', toast: 'Email copied', debug: false },
    { copy: '00447580751398', x: 83.5, y: 70.6, w: 12, h: 1.2, label: 'Copy Phone', toast: 'Phone copied', debug: false },
    { href: 'https://www.linkedin.com/in/moises-nevett-4b8ba62/', x: 83.5, y: 73, w: 7, h: 1.2, label: 'LinkedIn', debug: false },
    { href: 'https://www.instagram.com/moisesnevett/', x: 83.5, y: 75, w: 7, h: 1.3, label: 'Instagram', debug: false },
  ],
  52: [
    { overlay: 'showreelAuto', x: 0, y: 0, w: 100, h: 100, label: 'Play Showreel', debug: false },
  ],
}

export default function PortfolioSlideshow() {
  const [index, setIndex] = useHashIndex(0, SLIDES.length - 1)
  const [showUI, setShowUI] = useState(true)
  const [uiIdleHidden, setUiIdleHidden] = useState(false)
  const uiIdleTimer = useRef(null)
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [cursorVisible, setCursorVisible] = useState(true)
  const cursorTimer = useRef(null)
  const [overHotspot, setOverHotspot] = useState(false)
  const [overlay, setOverlay] = useState(null)
  const [toast, setToast] = useState(null)
  const [veil, setVeil] = useState(false)
  const toastTimer = useRef(null)
  const { prefetch } = useSmartPreload(SLIDES, index, overlay)

  const UI_IDLE_MS = 5000
  const UI_FADE_MS = 300
  const CURSOR_IDLE_MS = 5000
  const CURSOR_FADE_MS = 300
  const hotspots = HOTSPOTS[index] || []

  const closeOverlay = () => setOverlay(null)

  const showToast = (message) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1200)
  }

  const fadeToSlide = (targetIndex) => {
    setVeil(true)
    setTimeout(() => {
      setIndex(clamp(targetIndex, 0, SLIDES.length - 1))
      setOverlay(null)
      requestAnimationFrame(() => setVeil(false))
    }, 300)
  }

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      } else if (event.key.toLowerCase() === 'h' || event.key === 'Home') {
        event.preventDefault()
        goTo(0)
      } else if (event.key === 'Escape') {
        if (overlay) {
          event.preventDefault()
          closeOverlay()
        } else {
          setShowUI((value) => !value)
        }
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [overlay, index])

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
  }, [index, overlay])

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
    <div className={`h-screen w-screen overflow-hidden bg-black text-white select-none ${!overlay && !overHotspot ? 'cursor-none' : ''}`}>
      {!overlay && !overHotspot && (
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
          onOverlay={setOverlay}
          onToast={showToast}
          onHotspotHover={setOverHotspot}
          onPrefetch={prefetch}
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
          <span>H = first</span>
          <span>Esc = toggle UI / close overlay</span>
        </div>
      </div>

      {overlay && (
        <VideoOverlay
          src="/videos/showreel_2025.mp4"
          onClose={closeOverlay}
          onFinished={overlay === 'showreelAuto' ? () => fadeToSlide(53) : undefined}
        />
      )}

      <div className={`pointer-events-none fixed inset-0 bg-black transition-opacity duration-300 ${veil ? 'opacity-100' : 'opacity-0'}`} />

      {!overlay && !overHotspot && (
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

function MediaSlide({ slide, hotspots = [], onSelect, onOverlay, onToast, onHotspotHover, onPrefetch }) {
  const containerRef = useRef(null)
  const mediaRef = useRef(null)
  const [box, setBox] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    const measure = () => {
      const container = containerRef.current
      const media = mediaRef.current
      if (!container || !media) return

      const containerRect = container.getBoundingClientRect()
      const mediaRect = media.getBoundingClientRect()

      setBox({
        left: mediaRect.left - containerRect.left,
        top: mediaRect.top - containerRect.top,
        width: mediaRect.width,
        height: mediaRect.height,
      })
    }

    measure()
    const resizeObserver = new ResizeObserver(measure)
    if (containerRef.current) resizeObserver.observe(containerRef.current)
    if (mediaRef.current) resizeObserver.observe(mediaRef.current)
    window.addEventListener('resize', measure)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [slide?.src])

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
    <div ref={containerRef} className="relative flex h-full w-full items-center justify-center bg-black">
      {slide.type === 'image' ? (
        <img
          ref={mediaRef}
          src={slide.src}
          alt={slide.alt || ''}
          className="max-h-full max-w-full select-none object-contain"
          draggable={false}
          onLoad={() => setLoading(false)}
        />
      ) : (
        <video
          ref={mediaRef}
          src={slide.src}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="max-h-full max-w-full object-contain"
          onLoadedData={() => setLoading(false)}
        />
      )}

      {box && hotspots.length > 0 && (
        <div className="pointer-events-none absolute z-30" style={{ left: box.left, top: box.top, width: box.width, height: box.height }}>
          {hotspots.map((hotspot, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                if (typeof hotspot.to === 'number') {
                  onSelect?.(hotspot.to)
                } else if (hotspot.overlay) {
                  onOverlay?.(hotspot.overlay)
                } else if (hotspot.href) {
                  window.open(hotspot.href, '_blank', 'noopener,noreferrer')
                  onToast?.(hotspot.label || 'Opening...')
                } else if (hotspot.copy) {
                  const text = String(hotspot.copy)
                  const done = () => onToast?.(hotspot.toast || 'Copied!')

                  if (navigator.clipboard?.writeText) {
                    navigator.clipboard.writeText(text).then(done).catch(done)
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
                if (typeof hotspot.to === 'number' && onPrefetch) {
                  onPrefetch(hotspot.to)
                  onPrefetch(hotspot.to + 1)
                  onPrefetch(hotspot.to - 1)
                }
              }}
              onMouseLeave={() => onHotspotHover?.(false)}
              className="absolute pointer-events-auto cursor-pointer"
              aria-label={hotspot.label || (typeof hotspot.to === 'number' ? `Go to slide ${hotspot.to}` : 'Open')}
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
                width: `${hotspot.w}%`,
                height: `${hotspot.h}%`,
                background: 'transparent',
                border: hotspot.debug ? '1px solid rgba(255,0,0,0.6)' : 'none',
              }}
            />
          ))}
        </div>
      )}

      {loading && showLoader && <ClockLoader />}
    </div>
  )
}

function VideoOverlay({ src, onClose, onFinished }) {
  const videoRef = useRef(null)
  const idleTimer = useRef(null)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showLoader, setShowLoader] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    setLoading(true)
    setShowLoader(false)
    const timer = setTimeout(() => setShowLoader(true), 200)
    return () => clearTimeout(timer)
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (video) video.play().catch(() => {})

    const handleEnded = () => {
      if (onFinished) {
        setFadingOut(true)
        setTimeout(() => onFinished(), 300)
      } else {
        onClose?.()
      }
    }

    const handleReady = () => setLoading(false)

    video?.addEventListener('ended', handleEnded)
    video?.addEventListener('loadeddata', handleReady)

    return () => {
      video?.removeEventListener('ended', handleEnded)
      video?.removeEventListener('loadeddata', handleReady)
    }
  }, [onClose, onFinished])

  useEffect(() => {
    const scheduleHide = (delay) => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => setControlsVisible(false), delay)
    }

    scheduleHide(500)

    const onMove = () => {
      setControlsVisible(true)
      scheduleHide(2500)
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchstart', onMove, { passive: true })

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchstart', onMove)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  const play = () => videoRef.current?.play()
  const pause = () => videoRef.current?.pause()
  const stop = () => {
    if (!videoRef.current) return
    videoRef.current.pause()
    videoRef.current.currentTime = 0
  }
  const restart = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = 0
    videoRef.current.play()
  }

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${fadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <button
        onClick={onClose}
        className={`absolute right-4 top-4 z-50 h-7 w-7 rounded-md border border-white/10 bg-black/40 text-gray-200 leading-none transition-opacity duration-300 ${
          controlsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Close"
        title="Close"
        style={{ fontSize: '12px' }}
      >
        ×
      </button>

      <video ref={videoRef} src={src} autoPlay playsInline className="z-40 h-full w-full object-contain" />

      <div
        className={`absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 gap-2 transition-opacity duration-300 ${
          controlsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ fontSize: '9px' }}
      >
        <button onClick={play} className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-gray-200 hover:bg-black/50">Play</button>
        <button onClick={pause} className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-gray-200 hover:bg-black/50">Pause</button>
        <button onClick={restart} className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-gray-200 hover:bg-black/50">Restart</button>
        <button onClick={stop} className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-gray-200 hover:bg-black/50">Stop</button>
      </div>

      {loading && showLoader && <ClockLoader />}
    </div>
  )
}

function ClockLoader() {
  return (
    <>
      <style>{`
        .clock-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
        }
        .clock-loader {
          --clock-color: #fff;
          --clock-width: 4rem;
          --clock-radius: calc(var(--clock-width) / 2);
          --clock-minute-length: calc(var(--clock-width) * 0.4);
          --clock-hour-length: calc(var(--clock-width) * 0.2);
          --clock-thickness: 0.2rem;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: var(--clock-width);
          height: var(--clock-width);
          border: 3px solid var(--clock-color);
          border-radius: 50%;
        }
        .clock-loader::before,
        .clock-loader::after {
          position: absolute;
          content: "";
          top: calc(var(--clock-radius) * 0.25);
          width: var(--clock-thickness);
          background: var(--clock-color);
          border-radius: 10px;
          transform-origin: center calc(100% - calc(var(--clock-thickness) / 2));
          animation: spin infinite linear;
        }
        .clock-loader::before {
          height: var(--clock-minute-length);
          animation-duration: 2s;
        }
        .clock-loader::after {
          top: calc(var(--clock-radius) * 0.25 + var(--clock-hour-length));
          height: var(--clock-hour-length);
          animation-duration: 15s;
        }
        @keyframes spin {
          to {
            transform: rotate(1turn);
          }
        }
      `}</style>

      <div className="clock-wrap pointer-events-none">
        <div className="clock-loader" />
      </div>
    </>
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

function useSmartPreload(slides, index, overlay) {
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
    if (overlay || document.hidden) return

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
  }, [index, overlay, slides])

  useEffect(() => {
    for (let slideIndex = index + 5; slideIndex < slides.length; slideIndex += 1) {
      enqueueBack(slideIndex)
    }

    for (let slideIndex = 0; slideIndex < index - 2; slideIndex += 1) {
      enqueueBack(slideIndex)
    }

    pump()
  }, [index, overlay, slides])

  useEffect(() => {
    const showreelSrc = '/videos/showreel_2025.mp4'
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => warmSrc(showreelSrc, false))
    } else {
      setTimeout(() => warmSrc(showreelSrc, false), 800)
    }
  }, [])

  return { prefetch }
}
