import { useCallback, useEffect, useRef, useState } from 'react'
import { portfolioSlides } from '../data/portfolioSlides.js'
import { assetUrl } from '../utils/assetUrl.js'

const SLIDES = portfolioSlides
const TOUCH_SWIPE_BREAKPOINT_PX = 1024
const SWIPE_THRESHOLD_PX = 52
const PORTFOLIO_NAVIGATION_LOCK_MS = 140
const PORTFOLIO_MEDIA_TIMEOUT_MS = 9000
const PORTFOLIO_LOADER_DELAY_MS = 150
const PORTFOLIO_INTRO_AUTO_ADVANCE_MS = 3000
const PORTFOLIO_MEDIA_STATUS = new Map()

const HOTSPOT_DEBUG_ENABLED =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('hotspots') === 'debug'

const PORTFOLIO_HOTSPOTS = {
  'D_1.png': [
    {
      id: 'intro-email',
      copy: 'moisesnevett@gmail.com',
      toast: 'Email copied to clipboard',
      toastDuration: 1700,
      label: 'Copy intro email address',
      rect: { left: 76.2, top: 7.2, width: 20.4, height: 3.9 },
    },
  ],
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

function getPortfolioMediaStatus(src) {
  return PORTFOLIO_MEDIA_STATUS.get(src) || 'idle'
}

function setPortfolioMediaStatus(src, status) {
  PORTFOLIO_MEDIA_STATUS.set(src, status)
}

function shouldIgnorePortfolioShortcut(target) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true

  return Boolean(
    target.closest('input, textarea, select, [contenteditable="true"]'),
  )
}

function useIsTouchSwipeViewport() {
  const [isTouchSwipeViewport, setIsTouchSwipeViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= TOUCH_SWIPE_BREAKPOINT_PX : false,
  )

  useEffect(() => {
    const handleResize = () => {
      setIsTouchSwipeViewport(window.innerWidth <= TOUCH_SWIPE_BREAKPOINT_PX)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isTouchSwipeViewport
}

export default function PortfolioSlideshow({ onClose, suppressCustomCursor = false }) {
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
  const suppressClickAfterSwipeTimerRef = useRef(null)
  const navigationLockRef = useRef(false)
  const navigationLockTimerRef = useRef(null)
  const introAutoAdvanceTimerRef = useRef(null)
  const introAutoAdvanceConsumedRef = useRef(false)
  const swipeGestureRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    deltaX: 0,
    deltaY: 0,
    interactiveStart: false,
    swipeHandled: false,
  })
  const { prefetch } = useSmartPreload(SLIDES, index)
  const isTouchSwipeViewport = useIsTouchSwipeViewport()

  const UI_IDLE_MS = 5000
  const UI_FADE_MS = 300
  const CURSOR_IDLE_MS = 5000
  const CURSOR_FADE_MS = 300
  const currentAssetFilename = getAssetFilename(SLIDES[index]?.src || '')
  const hotspots = PORTFOLIO_HOTSPOTS[currentAssetFilename] || []

  const clearIntroAutoAdvance = useCallback((markConsumed = false) => {
    if (introAutoAdvanceTimerRef.current) {
      clearTimeout(introAutoAdvanceTimerRef.current)
      introAutoAdvanceTimerRef.current = null
    }

    if (markConsumed) {
      introAutoAdvanceConsumedRef.current = true
    }
  }, [])

  const showToast = useCallback((message, duration = 1200) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), duration)
  }, [])

  const goToPortfolioAsset = useCallback((targetAssetFilename) => {
    const targetIndex = SLIDES.findIndex((slide) => slide.src.endsWith(`/${targetAssetFilename}`))

    if (targetIndex === -1) {
      console.warn(`Portfolio target asset not found: ${targetAssetFilename}`)
      showToast('Slide unavailable')
      return
    }

    setIndex(targetIndex)
  }, [setIndex, showToast])

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

  useEffect(() => () => {
    if (suppressClickAfterSwipeTimerRef.current) {
      clearTimeout(suppressClickAfterSwipeTimerRef.current)
    }
  }, [])

  useEffect(() => () => {
    if (navigationLockTimerRef.current) {
      clearTimeout(navigationLockTimerRef.current)
    }
  }, [])

  useEffect(() => () => {
    clearIntroAutoAdvance()
  }, [clearIntroAutoAdvance])

  const requestNavigation = useCallback((updater, source = 'user') => {
    if (navigationLockRef.current) return

    if (source === 'user') {
      clearIntroAutoAdvance(true)
    }

    navigationLockRef.current = true
    setIndex(updater)

    if (navigationLockTimerRef.current) {
      clearTimeout(navigationLockTimerRef.current)
    }

    navigationLockTimerRef.current = setTimeout(() => {
      navigationLockRef.current = false
      navigationLockTimerRef.current = null
    }, PORTFOLIO_NAVIGATION_LOCK_MS)
  }, [clearIntroAutoAdvance, setIndex])

  const goTo = useCallback((targetIndex, source = 'user') =>
    requestNavigation(() => clamp(targetIndex, 0, SLIDES.length - 1), source),
  [requestNavigation])
  const goNext = useCallback((source = 'user') =>
    requestNavigation((current) => clamp(current + 1, 0, SLIDES.length - 1), source),
  [requestNavigation])
  const goPrev = useCallback((source = 'user') =>
    requestNavigation((current) => clamp(current - 1, 0, SLIDES.length - 1), source),
  [requestNavigation])

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
  }, [goNext, goPrev, goTo, onClose])

  useEffect(() => {
    prefetch(index)
    prefetch(index + 1)
    prefetch(index - 1)
  }, [index, prefetch])

  useEffect(() => {
    if (introAutoAdvanceConsumedRef.current || index !== 0) return undefined

    introAutoAdvanceTimerRef.current = setTimeout(() => {
      introAutoAdvanceConsumedRef.current = true
      introAutoAdvanceTimerRef.current = null
      goNext('auto')
    }, PORTFOLIO_INTRO_AUTO_ADVANCE_MS)

    return () => {
      if (introAutoAdvanceTimerRef.current) {
        clearTimeout(introAutoAdvanceTimerRef.current)
        introAutoAdvanceTimerRef.current = null
      }
    }
  }, [goNext, index])

  const armSwipeClickSuppression = () => {
    swipeGestureRef.current.swipeHandled = true
    if (suppressClickAfterSwipeTimerRef.current) {
      clearTimeout(suppressClickAfterSwipeTimerRef.current)
    }
    suppressClickAfterSwipeTimerRef.current = setTimeout(() => {
      swipeGestureRef.current.swipeHandled = false
      suppressClickAfterSwipeTimerRef.current = null
    }, 400)
  }

  const handleTouchStart = (event) => {
    if (!isTouchSwipeViewport) return

    const touch = event.touches?.[0]
    if (!touch) return
    const target =
      event.target instanceof HTMLElement ? event.target : null

    swipeGestureRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      interactiveStart: Boolean(target?.closest('button, a')),
      swipeHandled: swipeGestureRef.current.swipeHandled,
    }
  }

  const handleTouchMove = (event) => {
    if (!isTouchSwipeViewport || !swipeGestureRef.current.active) return

    const touch = event.touches?.[0]
    if (!touch) return

    swipeGestureRef.current.deltaX = touch.clientX - swipeGestureRef.current.startX
    swipeGestureRef.current.deltaY = touch.clientY - swipeGestureRef.current.startY
  }

  const handleTouchEnd = () => {
    if (!isTouchSwipeViewport || !swipeGestureRef.current.active) return

    const { deltaX, deltaY } = swipeGestureRef.current
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    const isIntentionalHorizontalSwipe = absX >= SWIPE_THRESHOLD_PX && absX > absY

    swipeGestureRef.current.active = false

    if (!isIntentionalHorizontalSwipe) return

    armSwipeClickSuppression()

    if (deltaX < 0) {
      goNext()
      return
    }

    goPrev()
  }

  const uiVisible = showUI && !uiIdleHidden
  const customCursorSuppressed = overHotspot || suppressCustomCursor

  return (
    <div
      className={`h-screen w-screen overflow-hidden bg-black text-white select-none ${!customCursorSuppressed ? 'cursor-none' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        swipeGestureRef.current.active = false
      }}
      onClickCapture={(event) => {
        if (!swipeGestureRef.current.swipeHandled) return
        event.preventDefault()
        event.stopPropagation()
        swipeGestureRef.current.swipeHandled = false
        if (suppressClickAfterSwipeTimerRef.current) {
          clearTimeout(suppressClickAfterSwipeTimerRef.current)
          suppressClickAfterSwipeTimerRef.current = null
        }
      }}
    >
      {!customCursorSuppressed && (
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

      {!customCursorSuppressed && (
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
  const [loading, setLoading] = useState(() => getPortfolioMediaStatus(slide?.src) !== 'ready')
  const [showLoader, setShowLoader] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [retryNonce, setRetryNonce] = useState(0)
  const videoRef = useRef(null)

  useEffect(() => {
    const cachedStatus = getPortfolioMediaStatus(slide?.src)

    setLoading(cachedStatus !== 'ready')
    setShowLoader(false)
    setLoadError(cachedStatus === 'error')
    setTimedOut(false)

    if (cachedStatus === 'ready') return undefined

    const loaderTimer = setTimeout(() => setShowLoader(true), PORTFOLIO_LOADER_DELAY_MS)
    const timeoutTimer = setTimeout(() => {
      setTimedOut(true)
    }, PORTFOLIO_MEDIA_TIMEOUT_MS)

    return () => {
      clearTimeout(loaderTimer)
      clearTimeout(timeoutTimer)
    }
  }, [retryNonce, slide?.src])

  useEffect(() => () => {
    if (onHotspotHover) onHotspotHover(false)
  }, [onHotspotHover])

  useEffect(() => {
    if (slide?.type !== 'video') return undefined

    const video = videoRef.current
    if (!video) return undefined

    video.play().catch(() => {})
    return undefined
  }, [retryNonce, slide?.src, slide?.type])

  const mediaStyle = {
    width: 'auto',
    height: 'auto',
    maxWidth: 'calc(100vw - 3rem)',
    maxHeight: 'calc(100vh - 3rem)',
  }

  const handleReady = () => {
    if (!slide?.src) return
    setPortfolioMediaStatus(slide.src, 'ready')
    setLoading(false)
    setLoadError(false)
    setTimedOut(false)
  }

  const handleError = () => {
    if (!slide?.src) return
    setPortfolioMediaStatus(slide.src, 'error')
    setLoadError(true)
    setLoading(false)
    setTimedOut(false)
  }

  const handleRetry = () => {
    if (!slide?.src) return
    setPortfolioMediaStatus(slide.src, 'loading')
    setLoading(true)
    setShowLoader(true)
    setLoadError(false)
    setTimedOut(false)
    setRetryNonce((current) => current + 1)
  }

  const showLoadingOverlay = (loading || timedOut || loadError) && showLoader
  const isMediaReady = !loading && !loadError

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-black p-6">
      <div className="relative inline-flex items-center justify-center">
        {slide.type === 'image' ? (
          <img
            key={`${slide.src}-${retryNonce}`}
            src={slide.src}
            alt={slide.alt || ''}
            className="block select-none object-contain transition-opacity duration-500 ease-out"
            style={{ ...mediaStyle, opacity: isMediaReady ? 1 : 0 }}
            draggable={false}
            onLoad={handleReady}
            onError={handleError}
          />
        ) : (
          <video
            key={`${slide.src}-${retryNonce}`}
            ref={videoRef}
            src={slide.src}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            className="block object-contain transition-opacity duration-500 ease-out"
            style={{ ...mediaStyle, opacity: isMediaReady ? 1 : 0 }}
            onCanPlay={handleReady}
            onLoadedData={handleReady}
            onError={handleError}
          />
        )}

        {hotspots.length > 0 && isMediaReady && (
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

      {showLoadingOverlay ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
          <PortfolioLoaderClock />
          {timedOut || loadError ? (
            <div className="pointer-events-auto flex flex-col items-center gap-2 text-center">
              <p className="text-[11px] tracking-[0.04em] text-white/70">
                {loadError
                  ? 'This portfolio slide could not load.'
                  : 'This portfolio slide is taking longer to load.'}
              </p>
              <button
                type="button"
                onClick={handleRetry}
                className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] text-white"
              >
                Retry
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function PortfolioLoaderClock() {
  return (
    <>
      <style>{`
        .portfolio-loader-clock {
          position: relative;
          width: 58px;
          height: 58px;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.95);
        }
        .portfolio-loader-clock::before,
        .portfolio-loader-clock::after {
          content: "";
          position: absolute;
          left: 50%;
          width: 2px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.95);
          transform-origin: 50% calc(100% - 1px);
        }
        .portfolio-loader-clock::before {
          top: 11px;
          height: 23px;
          margin-left: -1px;
          animation: portfolioLoaderMinute 2s linear infinite;
        }
        .portfolio-loader-clock::after {
          top: 17px;
          height: 17px;
          margin-left: -1px;
          animation: portfolioLoaderHour 12s linear infinite;
        }
        @keyframes portfolioLoaderMinute {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes portfolioLoaderHour {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <span className="portfolio-loader-clock" aria-hidden="true" />
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
      ? assetUrl('/cursors/reload.svg')
      : variant === 'prev'
        ? assetUrl('/cursors/left.svg')
        : assetUrl('/cursors/right.svg')

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

  const warmSlide = (slide, priority = false) => {
    if (!slide?.src || cacheRef.current[slide.src]) return
    cacheRef.current[slide.src] = true
    if (getPortfolioMediaStatus(slide.src) === 'idle') {
      setPortfolioMediaStatus(slide.src, 'loading')
    }

    try {
      const link = document.createElement('link')
      link.rel = priority ? 'preload' : 'prefetch'
      if (priority) link.as = slide.type === 'image' ? 'image' : 'video'
      link.href = slide.src
      document.head.appendChild(link)
    } catch {
      // noop
    }

    if (slide.type === 'image') {
      const image = new Image()
      image.onload = () => {
        setPortfolioMediaStatus(slide.src, 'ready')
      }
      image.onerror = () => {
        setPortfolioMediaStatus(slide.src, 'error')
      }
      image.src = slide.src
      return
    }

    const video = document.createElement('video')
    video.preload = priority ? 'auto' : 'metadata'
    video.muted = true
    video.src = slide.src
    const cleanup = () => {
      video.removeAttribute('src')
      video.load()
    }
    video.addEventListener('loadeddata', () => {
      setPortfolioMediaStatus(slide.src, 'ready')
      cleanup()
    }, { once: true })
    video.addEventListener('error', () => {
      setPortfolioMediaStatus(slide.src, 'error')
      cleanup()
    }, { once: true })
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
        warmSlide(slide, false)
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

    warmSlide(slide, true)
    if (inBounds(slideIndex + 1)) enqueueFront(slideIndex + 1)
    if (inBounds(slideIndex - 1)) enqueueFront(slideIndex - 1)
  }

  useEffect(() => {
    const connection = navigator.connection
    const slow = Boolean(connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g' || connection.saveData))
    const ahead = slow ? 2 : 4

    warmSlide(slides[index], true)
    if (inBounds(index + 1)) warmSlide(slides[index + 1], true)
    if (inBounds(index - 1)) warmSlide(slides[index - 1], true)
    if (inBounds(index + 2)) enqueueFront(index + 2)

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
