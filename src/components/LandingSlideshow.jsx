import { useEffect, useMemo, useRef, useState } from 'react'
import { landingSlides } from '../data/landingSlides.js'
import LandingSlide from './LandingSlide.jsx'

const MOBILE_IDLE_DELAY_MS = 3600
const MOBILE_AUTO_SCROLL_SPEED = 0.018
const DESKTOP_ZONE_RATIO = 0.33
const DESKTOP_TRANSITION_MS = 700
const STATIC_FADE_SLIDE_IDS = new Set(['slide-07', 'slide-08', 'slide-09'])
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

function useMobileAutoScroll(enabled) {
  const containerRef = useRef(null)
  const frameRef = useRef(null)
  const resumeTimerRef = useRef(null)
  const autoScrollEnabledRef = useRef(false)
  const lastFrameRef = useRef(null)

  useEffect(() => {
    if (!enabled) return undefined

    const container = containerRef.current
    if (!container) return undefined

    const stopAutoScroll = () => {
      autoScrollEnabledRef.current = false
      lastFrameRef.current = null
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }

    const tick = (timestamp) => {
      if (!autoScrollEnabledRef.current || !containerRef.current) return

      const delta = lastFrameRef.current ? timestamp - lastFrameRef.current : 16
      lastFrameRef.current = timestamp

      container.scrollTop += delta * MOBILE_AUTO_SCROLL_SPEED

      if (container.scrollTop >= container.scrollHeight - container.clientHeight - 2) {
        container.scrollTop = 1
      }

      frameRef.current = requestAnimationFrame(tick)
    }

    const startAutoScroll = () => {
      if (autoScrollEnabledRef.current) return
      autoScrollEnabledRef.current = true
      frameRef.current = requestAnimationFrame(tick)
    }

    const scheduleResume = () => {
      stopAutoScroll()
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = setTimeout(startAutoScroll, MOBILE_IDLE_DELAY_MS)
    }

    const handleUserActivity = () => {
      scheduleResume()
    }

    scheduleResume()
    container.addEventListener('touchstart', handleUserActivity, { passive: true })
    container.addEventListener('touchmove', handleUserActivity, { passive: true })
    container.addEventListener('wheel', handleUserActivity, { passive: true })

    return () => {
      stopAutoScroll()
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current)
      container.removeEventListener('touchstart', handleUserActivity)
      container.removeEventListener('touchmove', handleUserActivity)
      container.removeEventListener('wheel', handleUserActivity)
    }
  }, [enabled])

  return containerRef
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

export default function LandingSlideshow({ keyboardNavigationDisabled = false }) {
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
  const mobileSlides = useMemo(
    () => [...landingSlides, landingSlides[0]].filter(Boolean),
    [],
  )
  const mobileContainerRef = useMobileAutoScroll(true)

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
      if (window.innerWidth < 768) return
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
  }, [keyboardNavigationDisabled, desktopIndex])

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
        className="relative hidden h-screen overflow-hidden md:block"
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
        className="h-screen snap-y snap-mandatory overflow-y-auto overscroll-contain md:hidden"
      >
        {mobileSlides.map((slide, index) => (
          <div key={`${slide.id}-${index}`} className="snap-start">
            <LandingSlide slide={slide} mode="mobile" onRequestNext={goNext} />
          </div>
        ))}
      </section>
    </>
  )
}
