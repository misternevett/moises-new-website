import React, { useEffect, useRef, useState } from 'react'

/**
 * SLIDESHOW PORTFOLIO (Vite + React + Tailwind)
 * - Fullscreen slideshow with letterboxed media
 * - Arrow keys / click zones navigation
 * - Hotspots on specific slides (incl. overlay launcher)
 * - Video overlay (auto-play, simple controls, Esc/× to close, auto-close on end)
 * - Subtle, auto-hiding UI (300ms fade) for both overlay controls and slideshow HUD
 * - Loader shown while a slide/overlay video is preparing (no flash on fast loads)
 * - Special: slide 53 (index 52) click-anywhere opens showreel and advances to slide 54 on finish
 */

const SLIDES = [
  ...Array.from({ length: 54 }, (_, i) => ({
    type: 'video',
    src: `/slides/D_${i + 1}.mp4`,
    alt: `D_${i + 1}`,
  })),
]

// Hotspots (percent-based)
const HOTSPOTS = {
  0: [
    { to: 1,  x: 74, y: 7, w: 8, h: 6, label: 'Work',    debug: false },
    { to: 49, x: 82, y: 7, w: 8, h: 6, label: 'About',   debug: false },
    { to: 50, x: 90, y: 7, w: 8, h: 6, label: 'Contact', debug: false },
    { copy: 'moisesnevett@gmail.com', x: 5, y: 92, w: 18, h: 3, label: 'Copy Email', toast: 'Email copied', debug: false },
    { overlay: 'showreel', x: 75, y: 74, w: 22, h: 26, label: 'Workreel', debug: false },
  ],
  1: [
    { to: 6,  x: 8,   y: 20, w: 30, h: 4, label: 'Rabanne',     debug: false },
    { to: 32, x: 8,   y: 25, w: 30, h: 3, label: 'Zegna',       debug: false },
    { to: 25, x: 7.5, y: 52, w: 32, h: 3, label: 'Gucci Vault', debug: false },
    { to: 13, x: 8,   y: 56, w: 32, h: 3, label: 'Coach',       debug: false },
    { to: 39, x: 8,   y: 64, w: 30, h: 4, label: 'Burberry',    debug: false },
    { to: 46, x: 58,  y: 20, w: 33, h: 4, label: 'McLaren',     debug: false },
  ],
  // Slide 3 (index 2): one shortcut to slide 21
  2: [
    { to: 20, x: 8, y: 42, w: 33, h: 4, label: 'To Slide 21', debug: false },
  ],
  // Slide 53 (index 52): showreel click-anywhere
  52: [
    { overlay: 'showreelAuto', x: 0, y: 0, w: 100, h: 100, label: 'Play Showreel', debug: false },
  ],
  // Contact slides
  49: [
    { copy: 'moisesnevett@gmail.com', x: 83.5, y: 68.5, w: 12, h: 1.2, label: 'Copy Email', toast: 'Email copied', debug: false },
    { copy: '00447580751398',         x: 83.5, y: 70.6, w: 12, h: 1.2, label: 'Copy Phone', toast: 'Phone copied', debug: false },
    { href: 'https://www.linkedin.com/in/moises-nevett-4b8ba62/', x: 83.5, y: 73, w: 7, h: 1.2, label: 'LinkedIn', debug: false },
    { href: 'https://www.instagram.com/moisesnevett/',             x: 83.5, y: 75, w: 7, h: 1.3, label: 'Instagram', debug: false },
  ],
  50: [
    { copy: 'moisesnevett@gmail.com', x: 83.5, y: 68.5, w: 12, h: 1.2, label: 'Copy Email', toast: 'Email copied', debug: false },
    { copy: '00447580751398',         x: 83.5, y: 70.6, w: 12, h: 1.2, label: 'Copy Phone', toast: 'Phone copied', debug: false },
    { href: 'https://www.linkedin.com/in/moises-nevett-4b8ba62/', x: 83.5, y: 73, w: 7, h: 1.2, label: 'LinkedIn', debug: false },
    { href: 'https://www.instagram.com/moisesnevett/',            x: 83.5, y: 75, w: 7, h: 1.3, label: 'Instagram', debug: false },
  ],
  51: [
    { copy: 'moisesnevett@gmail.com', x: 83.5, y: 68.5, w: 12, h: 1.2, label: 'Copy Email', toast: 'Email copied', debug: false },
    { copy: '00447580751398',         x: 83.5, y: 70.6, w: 12, h: 1.2, label: 'Copy Phone', toast: 'Phone copied', debug: false },
    { href: 'https://www.linkedin.com/in/moises-nevett-4b8ba62/', x: 83.5, y: 73, w: 7, h: 1.2, label: 'LinkedIn', debug: false },
    { href: 'https://www.instagram.com/moisesnevett/',            x: 83.5, y: 75, w: 7, h: 1.3, label: 'Instagram', debug: false },
  ],
}

const CURSORS = {
  next: "url('/cursors/right.svg') 12 8, pointer",
  prev: "url('/cursors/left.svg') 4 8, pointer",
  reload: "url('/cursors/reload.svg') 8 8, pointer",
}

export default function App() {
  const [index, setIndex] = useHashIndex(0, SLIDES.length - 1)
  const [showUI, setShowUI] = useState(true)
  const [uiIdleHidden, setUiIdleHidden] = useState(false)
  const uiIdleTimer = useRef(null)
  const UI_IDLE_MS = 5000
  const UI_FADE_MS = 300

  // Ghost cursor
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [cursorVisible, setCursorVisible] = useState(true)
  const cursorTimer = useRef(null)
  const CURSOR_IDLE_MS = 5000
  const CURSOR_FADE_MS = 300

  const [overHotspot, setOverHotspot] = useState(false)
  const hotspots = HOTSPOTS[index] || []

  const [overlay, setOverlay] = useState(null)
  const openOverlay = (name) => setOverlay(name)
  const closeOverlay = () => setOverlay(null)

  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const showToast = (msg) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1200)
  }

  // Veil
  const [veil, setVeil] = useState(false)
  const fadeToSlide = (targetIndex) => {
    setVeil(true)
    setTimeout(() => {
      setIndex(clamp(targetIndex, 0, SLIDES.length - 1))
      setOverlay(null)
      requestAnimationFrame(() => setVeil(false))
    }, 300)
  }

  usePreload(SLIDES, index)

  // Keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev() }
      else if (e.key.toLowerCase() === 'h' || e.key === 'Home') { e.preventDefault(); goTo(0) }
      else if (e.key === 'Escape') {
        if (overlay) { e.preventDefault(); closeOverlay() }
        else { setShowUI(v => !v) }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [overlay])

  // HUD idle
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

  // Cursor idle
  useEffect(() => {
    const onMove = (e) => {
      const x = 'clientX' in e ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : cursorPos.x)
      const y = 'clientY' in e ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : cursorPos.y)
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

  useEffect(() => { setOverHotspot(false) }, [index])

  // ---------------- Share-link Gate (TTL-based) ----------------
  // Add ?share=TOKEN&ttl=60 to the URL. TTL defaults to 60 minutes if omitted.
  const [gate, setGate] = useState(false) // true once access is expired
  const gateTimer = useRef(null)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('share') || params.get('s')
    if (!token) return // only activate if a token is present

    const ttlMin = parseInt(params.get('ttl') || '60', 10) // default 60
    const key = `share_${token}`

    const now = Date.now()
    let firstSeen = now
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const data = JSON.parse(raw)
        if (data && data.firstSeen) firstSeen = data.firstSeen
      } else {
        localStorage.setItem(key, JSON.stringify({ firstSeen }))
      }
    } catch {}

    const expiresAt = firstSeen + ttlMin * 60 * 1000
    const ms = expiresAt - now
    if (ms <= 0) setGate(true)
    else gateTimer.current = setTimeout(() => setGate(true), ms)

    return () => { if (gateTimer.current) clearTimeout(gateTimer.current) }
  }, [])

  const goTo = (i) => setIndex(clamp(i, 0, SLIDES.length - 1))
  const goNext = () => setIndex(i => clamp(i + 1, 0, SLIDES.length - 1))
  const goPrev = () => setIndex(i => clamp(i - 1, 0, SLIDES.length - 1))

  const uiVisible = showUI && !uiIdleHidden

  const copyGateEmail = async () => {
    try { await navigator.clipboard.writeText('moisesnevett@gmail.com') } catch {}
    showToast('Email copied')
  }

  return (
    <div className={`w-screen h-screen bg-black text-white overflow-hidden select-none ${(!overlay && !overHotspot && !gate) ? 'cursor-none' : ''}`}>
      {/* Left/Right zones (disabled when overlay OR gate) */}
      {!overlay && !overHotspot && !gate && (
        <>
          <button
            aria-label={index === 0 ? 'Next' : 'Previous'}
            onClick={index === 0 ? goNext : goPrev}
            className="fixed inset-y-0 left-0 w-1/2 z-10 focus:outline-none"
            style={{ background: 'transparent', cursor: 'none' }}
          />
          <button
            aria-label="Next"
            onClick={goNext}
            className="fixed inset-y-0 right-0 w-1/2 z-10 focus:outline-none"
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

      {/* Slide content */}
      <div className="relative w-full h-full flex items-center justify-center">
        <MediaSlide
          slide={SLIDES[index]}
          hotspots={hotspots}
          onSelect={goTo}
          onOverlay={openOverlay}
          onToast={showToast}
          onHotspotHover={setOverHotspot}
        />
      </div>

      {/* HUD */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-3 md:p-4 flex items-end justify-between transition-opacity duration-[${UI_FADE_MS}ms] ${uiVisible ? 'opacity-80 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ fontSize: '9px' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-300/80">Slide {index + 1} / {SLIDES.length}</span>
        </div>
        <div className="hidden md:flex gap-3 text-gray-300/80">
          <span>←/→ navigate</span>
          <span>H = first</span>
          <span>Esc = toggle UI / close overlay</span>
        </div>
      </div>

      {/* Overlay video */}
      {overlay && (
        <VideoOverlay
          src="/videos/showreel_2025.mp4"
          onClose={closeOverlay}
          onFinished={overlay === 'showreelAuto' ? () => fadeToSlide(53) : undefined}
        />
      )}

      {/* Veil */}
      <div className={`fixed inset-0 pointer-events-none bg-black transition-opacity duration-300 ${veil ? 'opacity-100' : 'opacity-0'}`} />

      {/* Ghost cursor */}
      {!overlay && !overHotspot && !gate && (
        <CursorGhost
          x={cursorPos.x}
          y={cursorPos.y}
          variant={
            index === SLIDES.length - 1
              ? 'reload'
              : index === 0
              ? 'next'
              : (typeof window !== 'undefined' && cursorPos.x < window.innerWidth / 2) ? 'prev' : 'next'
          }
          visible={cursorVisible}
          fadeMs={CURSOR_FADE_MS}
        />
      )}

      {/* Expired/gated overlay */}
      {gate && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-6">
          <div
            className="text-center text-white"
            style={{ fontFamily: "'Helvetica Neue', Arial, Helvetica, system-ui, sans-serif", fontWeight: 500, fontSize: '11px', lineHeight: 1.6 }}
          >
            <p>
              Access expired. To renew, please email:{' '}
              <button onClick={copyGateEmail} className="underline decoration-white/60 hover:decoration-white focus:outline-none">
                moisesnevett@gmail.com
              </button>{' '}
              or contact via{' '}
              <a className="underline" href="https://www.linkedin.com/in/moises-nevett-4b8ba62/" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>.
            </p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-[110] px-3 py-2 rounded-md bg-black/70 text-white text-xs transition-opacity duration-300">
          {toast}
        </div>
      )}
    </div>
  )
}

function MediaSlide({ slide, hotspots = [], onSelect, onOverlay, onToast, onHotspotHover }) {
  const containerRef = useRef(null)
  const mediaRef = useRef(null)
  const [box, setBox] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showLoader, setShowLoader] = useState(false)

  useEffect(() => {
    const measure = () => {
      const c = containerRef.current
      const m = mediaRef.current
      if (!c || !m) return
      const cr = c.getBoundingClientRect()
      const mr = m.getBoundingClientRect()
      setBox({ left: mr.left - cr.left, top: mr.top - cr.top, width: mr.width, height: mr.height })
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (containerRef.current) ro.observe(containerRef.current)
    if (mediaRef.current) ro.observe(mediaRef.current)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [slide?.src])

  useEffect(() => {
    setLoading(true)
    setShowLoader(false)
    const t = setTimeout(() => setShowLoader(true), 200)
    return () => clearTimeout(t)
  }, [slide?.src])

  useEffect(() => () => { onHotspotHover && onHotspotHover(false) }, [onHotspotHover])

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative flex items-center justify-center">
      {slide.type === 'image' ? (
        <img
          ref={mediaRef}
          src={slide.src}
          alt={slide.alt || ''}
          className="max-w-full max-h-full object-contain select-none"
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
          className="max-w-full max-h-full object-contain"
          onLoadedData={() => setLoading(false)}
        />
      )}

      {box && hotspots.length > 0 && (
        <div className="absolute z-30 pointer-events-none" style={{ left: box.left, top: box.top, width: box.width, height: box.height }}>
          {hotspots.map((h, i) => (
            <button
              key={i}
              onClick={() => {
                if (h.to) onSelect && onSelect(h.to)
                else if (h.overlay) onOverlay && onOverlay(h.overlay)
                else if (h.href) { window.open(h.href, '_blank', 'noopener,noreferrer'); onToast && onToast(h.label || 'Opening…'); }
                else if (h.copy) {
                  const text = String(h.copy)
                  const done = () => onToast && onToast(h.toast || 'Copied!')
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(text).then(done).catch(() => done())
                  } else {
                    const ta = document.createElement('textarea')
                    ta.value = text
                    ta.style.position = 'fixed'
                    ta.style.opacity = '0'
                    document.body.appendChild(ta)
                    ta.focus(); ta.select()
                    try { document.execCommand('copy') } catch {}
                    document.body.removeChild(ta)
                    done()
                  }
                }
              }}
              onMouseEnter={() => onHotspotHover && onHotspotHover(true)}
              onMouseLeave={() => onHotspotHover && onHotspotHover(false)}
              className="absolute pointer-events-auto cursor-pointer"
              aria-label={h.label || (h.to ? `Go to slide ${h.to}` : 'Open')}
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                width: `${h.w}%`,
                height: `${h.h}%`,
                background: 'transparent',
                border: h.debug ? '1px solid rgba(255,0,0,0.6)' : 'none',
              }}
            />
          ))}
        </div>
      )}

      {loading && showLoader && <LoaderBars />}
    </div>
  )
}

function VideoOverlay({ src, onClose, onFinished }) {
  const vidRef = useRef(null)
  const [controlsVisible, setControlsVisible] = useState(true)
  const idleTimer = useRef(null)
  const [loading, setLoading] = useState(true)
  const [showLoader, setShowLoader] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  const OVERLAY_INITIAL_HIDE_MS = 500
  const OVERLAY_IDLE_MS = 2500

  useEffect(() => {
    setLoading(true)
    setShowLoader(false)
    const t = setTimeout(() => setShowLoader(true), 200)
    return () => clearTimeout(t)
  }, [src])

  useEffect(() => {
    const v = vidRef.current
    if (v) v.play().catch(() => {})
    const onEnded = () => {
      if (onFinished) {
        setFadingOut(true)
        setTimeout(() => onFinished && onFinished(), 300)
      } else {
        onClose && onClose()
      }
    }
    const onReady = () => setLoading(false)
    v?.addEventListener('ended', onEnded)
    v?.addEventListener('loadeddata', onReady)
    return () => {
      v?.removeEventListener('ended', onEnded)
      v?.removeEventListener('loadeddata', onReady)
    }
  }, [onClose, onFinished])

  useEffect(() => {
    const scheduleHide = (ms) => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => setControlsVisible(false), ms)
    }
    scheduleHide(OVERLAY_INITIAL_HIDE_MS)
    const onMove = () => { setControlsVisible(true); scheduleHide(OVERLAY_IDLE_MS) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchstart', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchstart', onMove)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [])

  const play = () => vidRef.current?.play()
  const pause = () => vidRef.current?.pause()
  const stop = () => { if (!vidRef.current) return; vidRef.current.pause(); vidRef.current.currentTime = 0 }
  const restart = () => { if (!vidRef.current) return; vidRef.current.currentTime = 0; vidRef.current.play() }

  return (
    <div className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-300 ${fadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <button
        onClick={onClose}
        className={`absolute top-4 right-4 h-7 w-7 rounded-md border border-white/10 bg-black/40 text-gray-200 leading-none transition-opacity duration-300 z-50 ${controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        aria-label="Close"
        title="Close"
        style={{ fontSize: '12px' }}
      >
        ×
      </button>

      <video ref={vidRef} src={src} autoPlay playsInline className="w-full h-full object-contain z-40" />

      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 transition-opacity duration-300 z-50 ${controlsVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ fontSize: '9px' }}
      >
        <button onClick={play}    className="px-2 py-1.5 rounded-md bg-black/40 hover:bg-black/50 text-gray-200 border border-white/10">Play</button>
        <button onClick={pause}   className="px-2 py-1.5 rounded-md bg-black/40 hover:bg-black/50 text-gray-200 border border-white/10">Pause</button>
        <button onClick={restart} className="px-2 py-1.5 rounded-md bg-black/40 hover:bg-black/50 text-gray-200 border border-white/10">Restart</button>
        <button onClick={stop}    className="px-2 py-1.5 rounded-md bg-black/40 hover:bg-black/50 text-gray-200 border border-white/10">Stop</button>
      </div>

      {loading && showLoader && <LoaderBars />}
    </div>
  )
}

function LoaderBars() {
  return (
    <>
      <style>{`
        .loader-bg { background: radial-gradient(ellipse at center, rgba(41,42,45,1) 0%, rgba(0,0,0,1) 100%); }
        .loader-ul { margin: 0; height: 10px; width: 500px; display: flex; gap: 10px; list-style: none; padding: 0; }
        .loader-li { width: 90px; height: 10px; display: block; }
        .loader-li:nth-child(-n+3) { background: rgba(255,255,255,0.9); box-shadow: inset 0 0 10px 2px rgba(117,182,255,0.5), 0 0 20px rgba(117,182,214,0.5); }
        .loader-li:nth-child(n+4) { box-shadow: inset 0 0 10px 1px rgba(117,182,255,0.4), 0 0 20px rgba(117,182,255,0.1); }
        @keyframes pulse { 0% { background: rgba(255,255,255,1); box-shadow: inset 0 0 10px 2px rgba(117,182,255,0.5), 0 0 40px 2px rgba(105,135,255,1);} 100% { background: rgba(255,255,255,0); box-shadow: inset 0 0 10px 2px rgba(117,182,255,0.5), 0 0 30px 2px rgba(105,135,255,0.3);} }
        .loader-li:nth-child(3) { animation: pulse 1s alternate infinite; }
      `}</style>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center loader-bg">
        <ul className="loader-ul">
          <li className="loader-li" />
          <li className="loader-li" />
          <li className="loader-li" />
          <li className="loader-li" />
          <li className="loader-li" />
        </ul>
      </div>
    </>
  )
}

function CursorGhost({ x, y, variant, visible, fadeMs = 300 }) {
  const size = 32
  const offset =
    variant === 'prev'   ? { x: -size * 0.25, y: -size * 0.5 } :
    variant === 'next'   ? { x: -size * 0.75, y: -size * 0.5 } :
                           { x: -size * 0.5,  y: -size * 0.5 }
  const src = variant === 'reload' ? '/cursors/reload.svg' : variant === 'prev' ? '/cursors/left.svg' : '/cursors/right.svg'
  return (
    <div
      className="fixed z-[70] pointer-events-none transition-opacity"
      style={{
        transform: `translate(${x + offset.x}px, ${y + offset.y}px)`,
        width: size,
        height: size,
        backgroundImage: `url('${src}')`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        opacity: visible ? 1 : 0,
        transitionDuration: `${fadeMs}ms`,
        left: 0, top: 0,
      }}
    />
  )
}

// ------------------------ Utilities -------------------------------------------
function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }

function useHashIndex(initial, max) {
  const [idx, setIdx] = useState(() => {
    const m = window.location.hash.match(/#\/(\d+)/)
    const start = m ? parseInt(m[1], 10) : initial
    return clamp(start, 0, max)
  })
  useEffect(() => {
    const onHash = () => {
      const m = window.location.hash.match(/#\/(\d+)/)
      if (m) setIdx(clamp(parseInt(m[1], 10), 0, max))
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [max])
  useEffect(() => {
    const desired = `#/${idx}`
    if (window.location.hash !== desired) window.location.hash = desired
  }, [idx])
  return [idx, setIdx]
}

function usePreload(slides, index) {
  const cacheRef = useRef({})
  useEffect(() => {
    const neighbors = [index - 1, index + 1].filter(i => i >= 0 && i < slides.length)
    neighbors.forEach(i => {
      const s = slides[i]
      if (s.type === 'image' && !cacheRef.current[s.src]) {
        const img = new Image()
        img.src = s.src
        cacheRef.current[s.src] = img
      } else if (s.type === 'video' && !cacheRef.current[s.src]) {
        const vid = document.createElement('video')
        vid.preload = 'auto'
        vid.muted = true
        vid.src = s.src
        vid.load()
        cacheRef.current[s.src] = vid
      }
    })
  }, [slides, index])
}
