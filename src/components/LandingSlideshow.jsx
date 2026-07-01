import { useEffect, useMemo, useRef, useState } from 'react'
import { landingSlides } from '../data/landingSlides.js'
import LandingSlide from './LandingSlide.jsx'

const MOBILE_IDLE_DELAY_MS = 3600
const MOBILE_AUTO_SCROLL_SPEED = 0.018

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

export default function LandingSlideshow() {
  const [desktopIndex, setDesktopIndex] = useState(0)
  const [hoverZone, setHoverZone] = useState(null)
  const mobileSlides = useMemo(
    () => [...landingSlides, landingSlides[0]].filter(Boolean),
    [],
  )
  const mobileContainerRef = useMobileAutoScroll(true)

  const goPrev = () => {
    setDesktopIndex((current) => (current - 1 + landingSlides.length) % landingSlides.length)
  }

  const goNext = () => {
    setDesktopIndex((current) => (current + 1) % landingSlides.length)
  }

  return (
    <>
      <section className="relative hidden h-screen overflow-hidden md:block">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${desktopIndex * 100}%)` }}
        >
          {landingSlides.map((slide) => (
            <div key={slide.id} className="h-full w-full shrink-0">
              <LandingSlide slide={slide} mode="desktop" />
            </div>
          ))}
        </div>

        <button
          type="button"
          aria-label="Previous slide"
          className="absolute inset-y-0 left-0 z-20 w-1/2 cursor-w-resize bg-transparent"
          onMouseEnter={() => setHoverZone('prev')}
          onMouseLeave={() => setHoverZone(null)}
          onClick={goPrev}
        />
        <button
          type="button"
          aria-label="Next slide"
          className="absolute inset-y-0 right-0 z-20 w-1/2 cursor-e-resize bg-transparent"
          onMouseEnter={() => setHoverZone('next')}
          onMouseLeave={() => setHoverZone(null)}
          onClick={goNext}
        />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-8 text-[10px] uppercase tracking-[0.35em] text-white/55">
          <span>{String(desktopIndex + 1).padStart(2, '0')} / {String(landingSlides.length).padStart(2, '0')}</span>
          <span className={`transition-opacity duration-300 ${hoverZone ? 'opacity-100' : 'opacity-0'}`}>
            {hoverZone === 'prev' ? 'Previous' : 'Next'}
          </span>
        </div>
      </section>

      <section
        ref={mobileContainerRef}
        className="h-screen snap-y snap-mandatory overflow-y-auto overscroll-contain md:hidden"
      >
        {mobileSlides.map((slide, index) => (
          <div key={`${slide.id}-${index}`} className="snap-start">
            <LandingSlide slide={slide} mode="mobile" />
          </div>
        ))}
      </section>
    </>
  )
}
