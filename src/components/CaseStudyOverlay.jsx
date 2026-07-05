import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { caseStudies } from '../data/caseStudies.js'
import CaseStudyDetail from './CaseStudyDetail.jsx'
import CaseStudyMediaLightbox from './CaseStudyMediaLightbox.jsx'
import CaseStudyTabs from './CaseStudyTabs.jsx'

const OVERLAY_EXIT_MS = 260
const AUTO_CLOSE_ARM_SCROLL_PX = 72
const AUTO_CLOSE_THRESHOLD_PX = 40
const MOBILE_AUTO_CLOSE_BREAKPOINT_PX = 767
const BACKDROP_BLUR = '18px'

export default function CaseStudyOverlay({ onClose }) {
  const [activeId, setActiveId] = useState(caseStudies[0]?.id)
  const [activeMedia, setActiveMedia] = useState(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const scrollRef = useRef(null)
  const panelRef = useRef(null)
  const closeTimerRef = useRef(null)
  const autoCloseArmedRef = useRef(false)
  const isClosingRef = useRef(false)
  const activeMediaRef = useRef(null)
  const activeCaseStudy = useMemo(
    () => caseStudies.find((item) => item.id === activeId) || caseStudies[0],
    [activeId],
  )

  useEffect(() => {
    activeMediaRef.current = activeMedia
  }, [activeMedia])

  const requestClose = useCallback(() => {
    if (activeMediaRef.current) {
      return
    }

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
    autoCloseArmedRef.current = false

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
    }

    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null
      onClose?.()
    }, OVERLAY_EXIT_MS)
  }, [onClose])

  useEffect(() => {
    isClosingRef.current = false
    const scrollY = window.scrollY || window.pageYOffset || 0
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyLeft = document.body.style.left
    const previousBodyRight = document.body.style.right
    const previousBodyWidth = document.body.style.width
    const previousDocumentOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `${-scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.documentElement.style.overflow = 'hidden'

    const openFrame = window.requestAnimationFrame(() => {
      setIsVisible(true)
    })

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        if (activeMediaRef.current) {
          setActiveMedia(null)
          return
        }
        requestClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.cancelAnimationFrame(openFrame)
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.left = previousBodyLeft
      document.body.style.right = previousBodyRight
      document.body.style.width = previousBodyWidth
      document.documentElement.style.overflow = previousDocumentOverflow
      window.removeEventListener('keydown', onKeyDown)
      isClosingRef.current = false

      window.requestAnimationFrame(() => {
        window.scrollTo(0, scrollY)
      })
    }
  }, [requestClose])

  const handleChange = (nextId) => {
    setActiveId(nextId)
    autoCloseArmedRef.current = false
    scrollRef.current?.scrollTo({ top: 0, behavior: 'auto' })
  }

  const handleAnchorSelect = (anchorId) => {
    const target = document.getElementById(anchorId)
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleOverlayScroll = useCallback((event) => {
    if (window.innerWidth <= MOBILE_AUTO_CLOSE_BREAKPOINT_PX || isClosing) {
      return
    }

    const scrollContainer = event.currentTarget
    if (!autoCloseArmedRef.current && scrollContainer.scrollTop > AUTO_CLOSE_ARM_SCROLL_PX) {
      autoCloseArmedRef.current = true
    }

    if (!autoCloseArmedRef.current || !panelRef.current) {
      return
    }

    const containerTop = scrollContainer.getBoundingClientRect().top
    const panelBottom = panelRef.current.getBoundingClientRect().bottom

    if (panelBottom - containerTop <= AUTO_CLOSE_THRESHOLD_PX) {
      requestClose()
    }
  }, [isClosing, requestClose])

  return (
    <div
      onClick={requestClose}
      className={`fixed inset-0 z-[140] text-black transition-opacity duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isVisible && !isClosing ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(180deg, rgba(0, 0, 0, 0.52) 0%, rgba(0, 0, 0, 0.48) 100%)',
          backdropFilter: `blur(${BACKDROP_BLUR})`,
          WebkitBackdropFilter: `blur(${BACKDROP_BLUR})`,
        }}
      />

      <button
        type="button"
        onClick={requestClose}
        className={`fixed left-1/2 top-5 z-[150] flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] md:top-7 ${
          isVisible && !isClosing
            ? 'translate-y-0 opacity-100'
            : '-translate-y-2 opacity-0'
        }`}
        aria-label="Close case studies"
      >
        <img
          src="/icons/close-button.png"
          alt=""
          className="block h-5 w-5 select-none object-contain"
          draggable={false}
        />
      </button>

      <div
        ref={scrollRef}
      onScroll={handleOverlayScroll}
        className={`relative h-full overscroll-contain scroll-smooth ${
          activeMedia ? 'overflow-y-hidden' : 'overflow-y-auto'
        }`}
      >
        <div className="min-h-[calc(100vh+100svh)] px-4 pt-24 md:px-6 md:pt-28">
          <div className="mx-auto w-full max-w-[52rem]">
            <div
              ref={panelRef}
              onClick={(event) => event.stopPropagation()}
              className={`overflow-hidden rounded-[1.9rem] bg-[#fbfaf8] text-black shadow-[0_34px_96px_rgba(0,0,0,0.18)] transition-[opacity,transform,filter] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isVisible && !isClosing
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-4 opacity-0 blur-[0.4px]'
              }`}
            >
              <div className="space-y-8 px-4 md:px-6">
                <CaseStudyTabs
                  title="CASE STUDIES"
                  tabs={caseStudies}
                  activeId={activeId}
                  onChange={handleChange}
                  edgeToEdge
                />

                <div className="mx-auto w-full max-w-[41rem] space-y-8 md:space-y-9">
                  {activeCaseStudy ? (
                    <CaseStudyDetail
                      caseStudy={activeCaseStudy}
                      onAnchorSelect={handleAnchorSelect}
                      onOpenMedia={setActiveMedia}
                    />
                  ) : null}
                </div>

                <CaseStudyTabs
                  title="NEXT CASE STUDY"
                  tabs={caseStudies}
                  activeId={activeId}
                  onChange={handleChange}
                  edgeToEdge
                />
              </div>
            </div>
          </div>

          <div className="h-[100svh]" aria-hidden="true" />
        </div>
      </div>

      {activeMedia ? (
        <CaseStudyMediaLightbox
          media={activeMedia}
          onClose={() => setActiveMedia(null)}
        />
      ) : null}
    </div>
  )
}
