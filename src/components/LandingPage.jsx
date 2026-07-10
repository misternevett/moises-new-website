import { useEffect, useRef, useState } from 'react'
import LandingSlideshow from './LandingSlideshow.jsx'
import BottomAccessNav from './BottomAccessNav.jsx'

const DESKTOP_BREAKPOINT_PX = 900
const LANDING_INTRO_FADE_MS = 700
const LANDING_INTRO_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'

export default function LandingPage({
  onOpenPortfolio,
  onOpenCaseStudies,
  keyboardNavigationDisabled = false,
  hideBottomNav = false,
}) {
  const [isDesktopViewport, setIsDesktopViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth > DESKTOP_BREAKPOINT_PX : true,
  )
  const [introVisible, setIntroVisible] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth <= DESKTOP_BREAKPOINT_PX,
  )
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth > DESKTOP_BREAKPOINT_PX
      setIsDesktopViewport(isDesktop)
      if (!isDesktop) {
        setIntroVisible(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateReducedMotion = () => {
      reducedMotionRef.current = mediaQuery.matches
      if (mediaQuery.matches) {
        setIntroVisible(true)
      }
    }

    updateReducedMotion()
    mediaQuery.addEventListener?.('change', updateReducedMotion)

    return () => {
      mediaQuery.removeEventListener?.('change', updateReducedMotion)
    }
  }, [])

  useEffect(() => {
    if (!isDesktopViewport || reducedMotionRef.current) {
      setIntroVisible(true)
      return undefined
    }

    const rafId = window.requestAnimationFrame(() => {
      setIntroVisible(true)
    })

    return () => window.cancelAnimationFrame(rafId)
  }, [isDesktopViewport])

  return (
    <main
      className="relative min-h-screen overflow-hidden bg-black text-white transition-opacity"
      style={{
        opacity: introVisible ? 1 : 0,
        transitionDuration: `${LANDING_INTRO_FADE_MS}ms`,
        transitionTimingFunction: LANDING_INTRO_EASE,
      }}
    >
      <LandingSlideshow keyboardNavigationDisabled={keyboardNavigationDisabled} />
      <BottomAccessNav
        onOpenPortfolio={onOpenPortfolio}
        onOpenCaseStudies={onOpenCaseStudies}
        hidden={hideBottomNav}
      />
    </main>
  )
}
