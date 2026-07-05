import { useEffect, useMemo, useRef, useState } from 'react'
import { landingSlides } from '../data/landingSlides.js'
import LandingSlide from './LandingSlide.jsx'
import MobileSlideTakeover from './MobileSlideTakeover.jsx'

const MOBILE_BREAKPOINT_PX = 900
const MOBILE_IDLE_DELAY_MS = 1700
const MOBILE_AUTO_SCROLL_PX_PER_FRAME = 0.4
const DEBUG_MOBILE_IDLE_DELAY_MS = 500
const DEBUG_MOBILE_AUTO_SCROLL_PX_PER_FRAME = 0.7
const DESKTOP_ZONE_RATIO = 0.33
const DESKTOP_TRANSITION_MS = 700
const STATIC_FADE_SLIDE_IDS = new Set(['slide-07', 'slide-08', 'slide-09'])
const MOBILE_TAKEOVER_SLIDE_IDS = new Set([
  'slide-01',
  'slide-02',
  'slide-04',
  'slide-05',
  'slide-06',
  'slide-07',
  'slide-08',
  'slide-09',
])
const DESKTOP_CURSOR = {
  prev: "url('/cursors/left.svg') 16 16, w-resize",
  next: "url('/cursors/right.svg') 16 16, e-resize",
  neutral: 'default',
}

function getDesktopZone(clientX, viewportWidth = window.innerWidth) {
  if (clientX < viewportWidth * DESKTOP_ZONE_RATIO) return 'prev'
  if (clientX > viewportWidth * (1 - DESKTOP_ZONE_RATIO)) return 'next'
  return null
}

function useIsMobileViewport() {
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT_PX : false,
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth <= MOBILE_BREAKPOINT_PX)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return isMobileViewport
}

function getAutoscrollDebugEnabled() {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('autoscroll') === 'debug'
}

function formatDebugTimestamp(timestamp) {
  if (!timestamp) return 'never'
  return new Date(timestamp).toLocaleTimeString('en-GB', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function MobileAutoscrollDebugHud({ debugState }) {
  const rows = [
    ['mobile active', String(debugState.mobileBreakpointActive)],
    ['selected scroll element', debugState.scrollContainerType],
    ['auto-scroll enabled', String(debugState.autoScrollEnabled)],
    ['paused', String(debugState.paused)],
    ['idle timer active', String(debugState.idleTimerActive)],
    ['RAF running', String(debugState.rafRunning)],
    ['scrollTop', String(debugState.scrollTop)],
    ['previous scrollTop', String(debugState.previousScrollTop)],
    ['delta per frame', String(debugState.deltaPerFrame)],
    ['scrollHeight', String(debugState.scrollHeight)],
    ['clientHeight', String(debugState.clientHeight)],
    ['canScroll', String(debugState.canScroll)],
    ['blocking overlay', String(debugState.overlayBlocking)],
    ['blocking detail', debugState.blockingDetail],
    ['last pause reason', debugState.lastPauseReason],
    ['frames advanced', String(debugState.framesAdvanced)],
    ['last movement', formatDebugTimestamp(debugState.lastMovementAt)],
    ['stuck count', String(debugState.stuckCount)],
    ['stuck', String(debugState.stuck)],
    ['last start time', formatDebugTimestamp(debugState.lastStartAt)],
  ]

  return (
    <div className="pointer-events-none fixed left-3 top-3 z-[160] max-w-[min(78vw,320px)] rounded-md bg-black/80 px-3 py-2 text-[10px] leading-[1.35] text-white shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <div className="mb-1 uppercase tracking-[0.14em] text-white/80">Autoscroll Debug</div>
      {rows.map(([label, value]) => (
        <div key={label} className="flex justify-between gap-3">
          <span className="text-white/65">{label}</span>
          <span className="text-right text-white">{value}</span>
        </div>
      ))}
    </div>
  )
}

function useMobileLoopScroll(enabled, paused = false, debugOptions = {}) {
  const {
    debugEnabled = false,
    mobileBreakpointActive = false,
    overlayBlocking = false,
    pauseReason = 'none',
  } = debugOptions
  const containerRef = useRef(null)
  const middleSetRef = useRef(null)
  const rafIdRef = useRef(null)
  const idleTimerIdRef = useRef(null)
  const isRunningRef = useRef(false)
  const isAutoScrollingRef = useRef(false)
  const lastFrameTimeRef = useRef(0)
  const lastScrollTopRef = useRef(0)
  const setHeightRef = useRef(0)
  const hasInitialisedRef = useRef(false)
  const selectedTargetModeRef = useRef('internal div')
  const lastPauseReasonRef = useRef('init')
  const lastStartAtRef = useRef(null)
  const lastMovementAtRef = useRef(null)
  const lastDeltaRef = useRef(0)
  const framesAdvancedRef = useRef(0)
  const stuckCountRef = useRef(0)
  const [debugState, setDebugState] = useState(() => ({
    mobileBreakpointActive,
    autoScrollEnabled: false,
    paused,
    idleTimerActive: false,
    rafRunning: false,
    scrollContainerType: 'internal div',
    scrollTop: 0,
    previousScrollTop: 0,
    deltaPerFrame: 0,
    scrollHeight: 0,
    clientHeight: 0,
    canScroll: false,
    overlayBlocking,
    blockingDetail: pauseReason,
    lastPauseReason: 'init',
    lastStartAt: null,
    framesAdvanced: 0,
    lastMovementAt: null,
    stuckCount: 0,
    stuck: false,
  }))

  const idleDelay = debugEnabled ? DEBUG_MOBILE_IDLE_DELAY_MS : MOBILE_IDLE_DELAY_MS
  const autoScrollStep = debugEnabled
    ? DEBUG_MOBILE_AUTO_SCROLL_PX_PER_FRAME
    : MOBILE_AUTO_SCROLL_PX_PER_FRAME
  const selectedBlockingDetail = overlayBlocking ? pauseReason : 'none'

  const clearAutoScrollGuardSoon = () => {
    requestAnimationFrame(() => {
      isAutoScrollingRef.current = false
    })
  }

  const getResolvedTarget = (mode) => {
    if (typeof document === 'undefined') return null

    const internalContainer = containerRef.current
    const scrollingElement = document.scrollingElement || document.documentElement

    if (mode === 'internal div') {
      return internalContainer ? { mode, element: internalContainer } : null
    }

    if (mode === 'document.scrollingElement') {
      return scrollingElement ? { mode, element: scrollingElement } : null
    }

    return scrollingElement ? { mode: 'window.scrollBy', element: scrollingElement } : null
  }

  const getTargetMetrics = (resolvedTarget) => {
    if (!resolvedTarget?.element) {
      return {
        scrollTop: 0,
        scrollHeight: 0,
        clientHeight: 0,
        canScroll: false,
      }
    }

    const clientHeight =
      resolvedTarget.mode === 'window.scrollBy'
        ? window.innerHeight
        : resolvedTarget.element.clientHeight

    return {
      scrollTop: resolvedTarget.element.scrollTop,
      scrollHeight: resolvedTarget.element.scrollHeight,
      clientHeight,
      canScroll: resolvedTarget.element.scrollHeight - clientHeight > 1,
    }
  }

  const setTargetScrollTop = (resolvedTarget, nextScrollTop) => {
    if (!resolvedTarget?.element) return

    if (resolvedTarget.mode === 'window.scrollBy') {
      const currentScrollTop = resolvedTarget.element.scrollTop
      window.scrollBy({
        left: 0,
        top: nextScrollTop - currentScrollTop,
        behavior: 'auto',
      })
      return
    }

    resolvedTarget.element.scrollTop = nextScrollTop
  }

  const getMobileScrollElement = (preferFallback = false) => {
    const modes = preferFallback
      ? ['document.scrollingElement', 'window.scrollBy', 'internal div']
      : [
          selectedTargetModeRef.current,
          'internal div',
          'document.scrollingElement',
          'window.scrollBy',
        ]

    for (const mode of modes) {
      const resolvedTarget = getResolvedTarget(mode)
      if (!resolvedTarget) continue

      const metrics = getTargetMetrics(resolvedTarget)
      if (!metrics.canScroll) continue

      selectedTargetModeRef.current = resolvedTarget.mode
      return { resolvedTarget, metrics }
    }

    const fallbackTarget =
      getResolvedTarget('internal div') ||
      getResolvedTarget('document.scrollingElement') ||
      getResolvedTarget('window.scrollBy')

    if (!fallbackTarget) return null

    selectedTargetModeRef.current = fallbackTarget.mode
    return { resolvedTarget: fallbackTarget, metrics: getTargetMetrics(fallbackTarget) }
  }

  const syncDebugState = () => {
    if (!debugEnabled) return

    const activeTarget = getMobileScrollElement()
    const metrics = activeTarget?.metrics ?? {
      scrollTop: 0,
      scrollHeight: 0,
      clientHeight: 0,
      canScroll: false,
    }

    setDebugState({
      mobileBreakpointActive,
      autoScrollEnabled: isRunningRef.current,
      paused,
      idleTimerActive: Boolean(idleTimerIdRef.current),
      rafRunning: Boolean(rafIdRef.current),
      scrollContainerType: selectedTargetModeRef.current,
      scrollTop: Math.round(metrics.scrollTop),
      previousScrollTop: Math.round(lastScrollTopRef.current),
      deltaPerFrame: Number(lastDeltaRef.current.toFixed(3)),
      scrollHeight: Math.round(metrics.scrollHeight),
      clientHeight: Math.round(metrics.clientHeight),
      canScroll: metrics.canScroll,
      overlayBlocking,
      blockingDetail: selectedBlockingDetail,
      lastPauseReason: lastPauseReasonRef.current,
      lastStartAt: lastStartAtRef.current,
      framesAdvanced: framesAdvancedRef.current,
      lastMovementAt: lastMovementAtRef.current,
      stuckCount: stuckCountRef.current,
      stuck: stuckCountRef.current > 20,
    })
  }

  useEffect(() => {
    if (!enabled) {
      hasInitialisedRef.current = false
      setHeightRef.current = 0
      return undefined
    }

    const container = containerRef.current
    const middleSet = middleSetRef.current

    if (!container || !middleSet) return undefined

    const syncSetHeight = () => {
      const nextSetHeight = middleSet.offsetHeight
      if (!nextSetHeight) return

      setHeightRef.current = nextSetHeight

      if (!hasInitialisedRef.current) {
        container.scrollTop = nextSetHeight
        lastScrollTopRef.current = nextSetHeight
        hasInitialisedRef.current = true
        syncDebugState()
      }
    }

    syncSetHeight()

    if (typeof ResizeObserver === 'undefined') return undefined

    const observer = new ResizeObserver(() => {
      syncSetHeight()
    })

    observer.observe(middleSet)
    observer.observe(container)

    return () => observer.disconnect()
  }, [enabled])

  useEffect(() => {
    if (!enabled) return undefined

    const container = containerRef.current
    if (!container || !middleSetRef.current) return undefined

    const normalizeScrollPosition = (resolvedTarget) => {
      const setHeight = setHeightRef.current
      if (!setHeight || !resolvedTarget?.element || resolvedTarget.mode !== 'internal div') return

      let nextScrollTop = resolvedTarget.element.scrollTop

      if (nextScrollTop < setHeight * 0.5) {
        nextScrollTop += setHeight
      } else if (nextScrollTop > setHeight * 2.5) {
        nextScrollTop -= setHeight
      }

      if (nextScrollTop !== resolvedTarget.element.scrollTop) {
        isAutoScrollingRef.current = true
        setTargetScrollTop(resolvedTarget, nextScrollTop)
        clearAutoScrollGuardSoon()
      }
    }

    const stopAutoScroll = (reason = lastPauseReasonRef.current) => {
      lastPauseReasonRef.current = reason
      isRunningRef.current = false
      isAutoScrollingRef.current = false
      lastFrameTimeRef.current = 0
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      syncDebugState()
    }

    const clearIdleTimer = () => {
      if (idleTimerIdRef.current) {
        clearTimeout(idleTimerIdRef.current)
        idleTimerIdRef.current = null
      }
    }

    const tick = (timestamp) => {
      if (!enabled || paused) {
        stopAutoScroll(pauseReason)
        clearIdleTimer()
        return
      }

      const preferFallback = debugEnabled && stuckCountRef.current > 20
      const activeTarget = getMobileScrollElement(preferFallback)
      if (!activeTarget?.resolvedTarget) {
        stopAutoScroll('no-scroll-target')
        return
      }

      const { resolvedTarget, metrics } = activeTarget
      if (!metrics.canScroll) {
        stopAutoScroll('cannot-scroll')
        return
      }

      const frameDelta = lastFrameTimeRef.current
        ? Math.max(1, Math.min(3, (timestamp - lastFrameTimeRef.current) / (1000 / 60)))
        : 1
      lastFrameTimeRef.current = timestamp

      const previousScrollTop = resolvedTarget.element.scrollTop
      const nextScrollTop = previousScrollTop + autoScrollStep * frameDelta

      isAutoScrollingRef.current = true
      setTargetScrollTop(resolvedTarget, nextScrollTop)
      normalizeScrollPosition(resolvedTarget)
      clearAutoScrollGuardSoon()

      const updatedScrollTop = resolvedTarget.element.scrollTop

      lastScrollTopRef.current = previousScrollTop
      lastDeltaRef.current = updatedScrollTop - previousScrollTop
      framesAdvancedRef.current += 1

      if (Math.abs(lastDeltaRef.current) > 0.01) {
        stuckCountRef.current = 0
        lastMovementAtRef.current = Date.now()
      } else {
        stuckCountRef.current += 1
        if (debugEnabled && stuckCountRef.current > 20) {
          if (selectedTargetModeRef.current === 'internal div') {
            selectedTargetModeRef.current = 'document.scrollingElement'
          } else if (selectedTargetModeRef.current === 'document.scrollingElement') {
            selectedTargetModeRef.current = 'window.scrollBy'
          }
        }
      }

      syncDebugState()
      rafIdRef.current = requestAnimationFrame(tick)
    }

    const startAutoScroll = () => {
      if (isRunningRef.current || paused) return

      const activeTarget = getMobileScrollElement()
      if (!activeTarget?.resolvedTarget || !activeTarget.metrics.canScroll) {
        lastPauseReasonRef.current = 'cannot-scroll'
        syncDebugState()
        return
      }

      clearIdleTimer()
      isRunningRef.current = true
      lastFrameTimeRef.current = 0
      lastStartAtRef.current = Date.now()
      lastMovementAtRef.current = null
      lastDeltaRef.current = 0
      framesAdvancedRef.current = 0
      stuckCountRef.current = 0
      lastScrollTopRef.current = activeTarget.resolvedTarget.element.scrollTop
      rafIdRef.current = requestAnimationFrame(tick)
      syncDebugState()
    }

    const scheduleResume = (reason = 'idle') => {
      stopAutoScroll(reason)
      clearIdleTimer()
      idleTimerIdRef.current = setTimeout(() => {
        idleTimerIdRef.current = null
        startAutoScroll()
      }, idleDelay)
      syncDebugState()
    }

    const handleScroll = () => {
      const activeTarget = getMobileScrollElement()
      if (activeTarget?.resolvedTarget) {
        normalizeScrollPosition(activeTarget.resolvedTarget)
      }

      if (isAutoScrollingRef.current) {
        syncDebugState()
        return
      }

      const currentScrollTop = activeTarget?.resolvedTarget?.element?.scrollTop ?? 0
      lastDeltaRef.current = currentScrollTop - lastScrollTopRef.current
      lastScrollTopRef.current = currentScrollTop
      syncDebugState()
    }

    const handlePointerDown = () => scheduleResume('pointerdown')
    const handleTouchStart = () => scheduleResume('touchstart')
    const handleTouchMove = () => scheduleResume('touchmove')
    const handleWheel = () => scheduleResume('wheel')
    const handleKeyDown = () => scheduleResume('keydown')

    if (paused) {
      clearIdleTimer()
      stopAutoScroll(pauseReason)
      syncDebugState()
      return undefined
    }

    scheduleResume()
    container.addEventListener('scroll', handleScroll, { passive: true })
    container.addEventListener('pointerdown', handlePointerDown, { passive: true })
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: true })
    container.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('keydown', handleKeyDown)
    syncDebugState()

    return () => {
      stopAutoScroll('cleanup')
      clearIdleTimer()
      container.removeEventListener('scroll', handleScroll)
      container.removeEventListener('pointerdown', handlePointerDown)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('wheel', handleWheel)
      window.removeEventListener('keydown', handleKeyDown)
      syncDebugState()
    }
  }, [autoScrollStep, enabled, idleDelay, paused, pauseReason])

  useEffect(() => {
    syncDebugState()
  }, [debugEnabled, enabled, mobileBreakpointActive, overlayBlocking, pauseReason, paused])

  useEffect(() => {
    if (!debugEnabled) return undefined

    const intervalId = setInterval(() => {
      syncDebugState()
    }, 120)

    return () => clearInterval(intervalId)
  }, [debugEnabled, enabled, mobileBreakpointActive, overlayBlocking, pauseReason, paused])

  return { containerRef, middleSetRef, debugState }
}

function shouldIgnoreKeyboardNavigationTarget(target) {
  if (!(target instanceof HTMLElement)) return false

  if (target.isContentEditable) return true

  return Boolean(
    target.closest(
      'input, textarea, select, button, [contenteditable="true"], [role="button"], video',
    ),
  )
}

function isSlide03VideoTakeoverOpen() {
  return Boolean(document.querySelector('video[src*="slide-03-takeover.mp4"]'))
}

function useSlide03TakeoverPresence(enabled) {
  const [isOpen, setIsOpen] = useState(() =>
    enabled && typeof document !== 'undefined' ? isSlide03VideoTakeoverOpen() : false,
  )

  useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      setIsOpen(false)
      return undefined
    }

    const syncPresence = () => {
      setIsOpen(isSlide03VideoTakeoverOpen())
    }

    syncPresence()

    if (typeof MutationObserver === 'undefined') return undefined

    const observer = new MutationObserver(() => {
      syncPresence()
    })

    observer.observe(document.body, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [enabled])

  return isOpen
}

export default function LandingSlideshow({ keyboardNavigationDisabled = false }) {
  const isMobileViewport = useIsMobileViewport()
  const autoscrollDebugEnabled = getAutoscrollDebugEnabled()
  const [activeMobileTakeoverSlideId, setActiveMobileTakeoverSlideId] = useState(null)
  const [desktopIndex, setDesktopIndex] = useState(0)
  const [desktopDisplayIndex, setDesktopDisplayIndex] = useState(1)
  const [isTrackTransitionEnabled, setIsTrackTransitionEnabled] = useState(true)
  const [hoverZone, setHoverZone] = useState(null)
  const [fadeOverlay, setFadeOverlay] = useState(null)
  const fadeTimeoutRef = useRef(null)
  const slideTimeoutRef = useRef(null)
  const isDesktopTransitioningRef = useRef(false)
  const activeDesktopSlide = landingSlides[desktopIndex]
  const hideDesktopOverlay =
    activeDesktopSlide?.hideDesktopOverlay ||
    ['video-trigger', 'vertical-b-state'].includes(activeDesktopSlide?.type)
  const desktopOverlayTone = activeDesktopSlide?.desktopTone === 'dark' ? 'text-black/48' : 'text-white/55'
  const desktopSlides = useMemo(
    () => [
      { key: 'clone-last', slide: landingSlides[landingSlides.length - 1] },
      ...landingSlides.map((slide) => ({ key: slide.id, slide })),
      { key: 'clone-first', slide: landingSlides[0] },
    ],
    [],
  )
  const mobileSlideSets = useMemo(
    () => [
      { key: 'clone-before', slides: landingSlides },
      { key: 'real', slides: landingSlides },
      { key: 'clone-after', slides: landingSlides },
    ],
    [],
  )
  const activeMobileTakeoverSlide = landingSlides.find(
    (slide) => slide.id === activeMobileTakeoverSlideId,
  ) || null
  const isSlide03TakeoverOpen = useSlide03TakeoverPresence(isMobileViewport)
  const mobileAutoscrollPauseReason = activeMobileTakeoverSlide
    ? 'mobile-slide-takeover-open'
    : isSlide03TakeoverOpen
      ? 'slide-03-video-open'
      : keyboardNavigationDisabled
        ? 'overlay-open'
        : 'none'
  const isMobileAutoScrollPaused = mobileAutoscrollPauseReason !== 'none'
  const {
    containerRef: mobileContainerRef,
    middleSetRef,
    debugState: mobileAutoscrollDebugState,
  } = useMobileLoopScroll(
    isMobileViewport,
    isMobileAutoScrollPaused,
    {
      debugEnabled: autoscrollDebugEnabled,
      mobileBreakpointActive: isMobileViewport,
      overlayBlocking: isMobileAutoScrollPaused,
      pauseReason: mobileAutoscrollPauseReason,
    },
  )

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current)
      }

      if (slideTimeoutRef.current) {
        clearTimeout(slideTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (keyboardNavigationDisabled) return
      if (isMobileViewport) return
      if (event.defaultPrevented) return
      if (event.repeat) return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      if (isDesktopTransitioningRef.current) return
      if (isSlide03VideoTakeoverOpen()) return
      if (shouldIgnoreKeyboardNavigationTarget(event.target)) return

      event.preventDefault()

      if (event.key === 'ArrowLeft') {
        navigateBy(-1)
        return
      }

      navigateBy(1)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [desktopIndex, isMobileViewport, keyboardNavigationDisabled])

  const shouldFadeBetweenSlides = (fromIndex, toIndex) => {
    const fromSlideId = landingSlides[fromIndex]?.id
    const toSlideId = landingSlides[toIndex]?.id

    return STATIC_FADE_SLIDE_IDS.has(fromSlideId) && STATIC_FADE_SLIDE_IDS.has(toSlideId)
  }

  const resetTrackPosition = (nextIndex) => {
    setIsTrackTransitionEnabled(false)
    setDesktopDisplayIndex(nextIndex + 1)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsTrackTransitionEnabled(true)
        isDesktopTransitioningRef.current = false
      })
    })
  }

  const navigateBy = (direction) => {
    if (isDesktopTransitioningRef.current) return

    const currentIndex = desktopIndex
    const nextIndex = (currentIndex + direction + landingSlides.length) % landingSlides.length
    const shouldFade = shouldFadeBetweenSlides(currentIndex, nextIndex)

    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current)
      fadeTimeoutRef.current = null
    }

    if (slideTimeoutRef.current) {
      clearTimeout(slideTimeoutRef.current)
      slideTimeoutRef.current = null
    }

    isDesktopTransitioningRef.current = true

    if (!shouldFade) {
      setFadeOverlay(null)
      setDesktopIndex(nextIndex)

      const isWrappingForward = direction === 1 && currentIndex === landingSlides.length - 1
      const isWrappingBackward = direction === -1 && currentIndex === 0

      setDesktopDisplayIndex((currentDisplayIndex) => currentDisplayIndex + direction)

      slideTimeoutRef.current = setTimeout(() => {
        if (isWrappingForward || isWrappingBackward) {
          resetTrackPosition(nextIndex)
        } else {
          isDesktopTransitioningRef.current = false
        }
        slideTimeoutRef.current = null
      }, DESKTOP_TRANSITION_MS)

      return
    }

    const outgoingSlide = landingSlides[desktopIndex]
    setFadeOverlay({
      slide: outgoingSlide,
      isVisible: true,
    })
    setDesktopIndex(nextIndex)
    setDesktopDisplayIndex(nextIndex + 1)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFadeOverlay((currentOverlay) =>
          currentOverlay ? { ...currentOverlay, isVisible: false } : currentOverlay,
        )
      })
    })

    fadeTimeoutRef.current = setTimeout(() => {
      setFadeOverlay(null)
      isDesktopTransitioningRef.current = false
      fadeTimeoutRef.current = null
    }, DESKTOP_TRANSITION_MS)
  }

  const goPrev = () => {
    navigateBy(-1)
  }

  const goNext = () => {
    navigateBy(1)
  }

  return (
    <>
      <section
        className={`relative h-screen overflow-hidden ${isMobileViewport ? 'hidden' : 'block'}`}
        onMouseMove={(event) => setHoverZone(getDesktopZone(event.clientX))}
        onMouseLeave={() => setHoverZone(null)}
        onClick={(event) => {
          const zone = getDesktopZone(event.clientX)
          if (zone === 'prev') navigateBy(-1)
          if (zone === 'next') navigateBy(1)
        }}
        style={{ cursor: DESKTOP_CURSOR[hoverZone || 'neutral'] }}
      >
        <div
          className={`flex h-full w-full ${
            fadeOverlay || !isTrackTransitionEnabled
              ? 'transition-none'
              : 'transition-transform duration-700 ease-out'
          }`}
          style={{ transform: `translateX(-${desktopDisplayIndex * 100}%)` }}
        >
          {desktopSlides.map(({ key, slide }) => (
            <div key={key} className="h-full w-full shrink-0">
              <LandingSlide slide={slide} mode="desktop" onRequestNext={goNext} />
            </div>
          ))}
        </div>

        {fadeOverlay ? (
          <div
            className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-700 ease-out ${
              fadeOverlay.isVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <LandingSlide slide={fadeOverlay.slide} mode="desktop" onRequestNext={goNext} />
          </div>
        ) : null}

        {!hideDesktopOverlay && (
          <div className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-8 text-[10px] uppercase tracking-[0.35em] ${desktopOverlayTone}`}>
            <span>{String(desktopIndex + 1).padStart(2, '0')} / {String(landingSlides.length).padStart(2, '0')}</span>
            <span className={`transition-opacity duration-300 ${hoverZone ? 'opacity-100' : 'opacity-0'}`}>
              {hoverZone === 'prev' ? 'Previous' : 'Next'}
            </span>
          </div>
        )}
      </section>

      <section
        ref={mobileContainerRef}
        className={`h-screen overflow-y-auto overscroll-contain bg-white ${isMobileViewport ? 'block' : 'hidden'}`}
      >
        <div className="bg-white px-0 pb-20 pt-1">
          {mobileSlideSets.map((slideSet, setIndex) => (
            <div
              key={slideSet.key}
              ref={setIndex === 1 ? middleSetRef : undefined}
              className="flex flex-col gap-2.5"
            >
              {slideSet.slides.map((slide, index) => (
                <div
                  key={`${slideSet.key}-${slide.id}-${index}`}
                  className={`w-full ${MOBILE_TAKEOVER_SLIDE_IDS.has(slide.id) ? 'cursor-pointer' : ''}`}
                  onClick={
                    MOBILE_TAKEOVER_SLIDE_IDS.has(slide.id)
                      ? () => setActiveMobileTakeoverSlideId(slide.id)
                      : undefined
                  }
                >
                  <LandingSlide slide={slide} mode="mobile" onRequestNext={goNext} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {activeMobileTakeoverSlide ? (
        <MobileSlideTakeover
          slide={activeMobileTakeoverSlide}
          onClose={() => setActiveMobileTakeoverSlideId(null)}
        />
      ) : null}

      {autoscrollDebugEnabled && isMobileViewport ? (
        <MobileAutoscrollDebugHud debugState={mobileAutoscrollDebugState} />
      ) : null}
    </>
  )
}
