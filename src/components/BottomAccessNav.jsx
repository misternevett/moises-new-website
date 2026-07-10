import { useEffect, useRef, useState } from 'react'
import { CONTACT } from '../config.js'

const BUTTONS = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'case-studies', label: 'Case Studies' },
  { id: 'misu', label: 'Studio Practice' },
]

const BUTTON_FONT = '"Didot", "Bodoni 72", "Iowan Old Style", "Times New Roman", serif'
const DESKTOP_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const DESKTOP_SLOT_WIDTH = '10.5rem'
const DESKTOP_TRANSITION_MS = 280
const INTRO_REVEAL_DELAY_MS = 3000
const INTRO_REVEAL_DURATION_MS = 3000
const COLLAPSED_PILL_WIDTH = '24px'
const COLLAPSED_PILL_HEIGHT = '6px'
const COLLAPSED_PILL_GAP = '9px'
const MOBILE_BREAKPOINT_PX = 900
const MOBILE_COMPACT_BREAKPOINT_PX = 400

function AccessButton({
  label,
  onClick,
  dimmed,
  onHoverChange,
  mobile = false,
  compactMobile = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={mobile ? undefined : () => onHoverChange(true)}
      onMouseLeave={mobile ? undefined : () => onHoverChange(false)}
      className={`flex items-center justify-center overflow-hidden bg-black text-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] ${
        mobile
          ? compactMobile
            ? 'min-h-10 rounded-md border border-white/25 px-2 py-2'
            : 'min-h-11 rounded-md border border-white/25 px-3 py-2'
          : 'h-8 w-full rounded-md border border-white/25 px-3 py-2 transition-opacity duration-200'
      } ${dimmed ? 'opacity-40' : 'opacity-100'}`}
      style={{
        fontFamily: BUTTON_FONT,
        fontSize: mobile ? (compactMobile ? '9px' : '11px') : '11px',
        fontWeight: 400,
        letterSpacing: mobile && compactMobile ? '0.01em' : '0.02em',
      }}
    >
      <span className="whitespace-nowrap uppercase">{label}</span>
    </button>
  )
}

export default function BottomAccessNav({ onOpenPortfolio, onOpenCaseStudies, hidden = false }) {
  const [isMobileViewport, setIsMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT_PX : false,
  )
  const [isCompactMobileViewport, setIsCompactMobileViewport] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_COMPACT_BREAKPOINT_PX : false,
  )
  const [expanded, setExpanded] = useState(false)
  const [introRevealActive, setIntroRevealActive] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)
  const introRevealPlayedRef = useRef(false)
  const introRevealStartTimerRef = useRef(null)
  const introRevealEndTimerRef = useRef(null)
  const reducedMotionRef = useRef(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth <= MOBILE_BREAKPOINT_PX)
      setIsCompactMobileViewport(window.innerWidth <= MOBILE_COMPACT_BREAKPOINT_PX)
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
    }

    updateReducedMotion()
    mediaQuery.addEventListener?.('change', updateReducedMotion)

    return () => {
      mediaQuery.removeEventListener?.('change', updateReducedMotion)
    }
  }, [])

  useEffect(() => {
    if (hidden) {
      setExpanded(false)
      setIntroRevealActive(false)
      setHoveredId(null)
      return
    }

    // Return to the default collapsed three-pill state after overlays close.
    setExpanded(false)
    setHoveredId(null)
  }, [hidden])

  useEffect(() => () => {
    if (introRevealStartTimerRef.current) {
      clearTimeout(introRevealStartTimerRef.current)
      introRevealStartTimerRef.current = null
    }
    if (introRevealEndTimerRef.current) {
      clearTimeout(introRevealEndTimerRef.current)
      introRevealEndTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (
      hidden ||
      isMobileViewport ||
      introRevealPlayedRef.current ||
      reducedMotionRef.current
    ) {
      return
    }

    introRevealPlayedRef.current = true
    introRevealStartTimerRef.current = setTimeout(() => {
      setIntroRevealActive(true)
      introRevealStartTimerRef.current = null
      introRevealEndTimerRef.current = setTimeout(() => {
        setIntroRevealActive(false)
        introRevealEndTimerRef.current = null
      }, INTRO_REVEAL_DURATION_MS)
    }, INTRO_REVEAL_DELAY_MS)
  }, [hidden, isMobileViewport])

  const endIntroReveal = () => {
    if (introRevealStartTimerRef.current) {
      clearTimeout(introRevealStartTimerRef.current)
      introRevealStartTimerRef.current = null
    }
    if (introRevealEndTimerRef.current) {
      clearTimeout(introRevealEndTimerRef.current)
      introRevealEndTimerRef.current = null
    }
    setIntroRevealActive(false)
  }

  const handleAction = (id) => {
    endIntroReveal()

    if (id === 'portfolio') {
      onOpenPortfolio()
      return
    }

    if (id === 'case-studies') {
      onOpenCaseStudies()
      return
    }

    window.open(CONTACT.misuStudio, '_blank', 'noopener,noreferrer')
  }

  const visibilityClass = hidden ? 'pointer-events-none opacity-0' : 'pointer-events-auto opacity-100'
  const desktopExpanded = expanded || introRevealActive

  return (
    <>
      <div className={`fixed bottom-0 right-0 z-40 transition-opacity duration-200 ${visibilityClass} ${isMobileViewport ? 'hidden' : 'block'}`}>
        <div
          className="relative h-[14vh] min-h-[8rem] w-[40vw] min-w-[26rem]"
          onMouseEnter={() => {
            endIntroReveal()
            setExpanded(true)
          }}
          onMouseLeave={() => {
            setExpanded(false)
            setHoveredId(null)
          }}
        >
          <div className="absolute bottom-5 right-6">
            <div
              className="relative flex items-end justify-end"
              style={{ transformOrigin: 'bottom right' }}
            >
              <div
                className="absolute bottom-0 right-0 flex items-center justify-end transition-[opacity,transform]"
                style={{
                  opacity: desktopExpanded ? 0 : 1,
                  transform: desktopExpanded ? 'translateY(3px) scale(0.96)' : 'translateY(0) scale(1)',
                  transformOrigin: 'bottom right',
                  pointerEvents: desktopExpanded ? 'none' : 'auto',
                  gap: COLLAPSED_PILL_GAP,
                  transitionDuration: `${DESKTOP_TRANSITION_MS}ms`,
                  transitionTimingFunction: DESKTOP_EASE,
                }}
              >
                {BUTTONS.map((button) => (
                  <span
                    key={button.id}
                    className="block rounded-full border border-black/70 bg-black shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
                    style={{
                      width: COLLAPSED_PILL_WIDTH,
                      height: COLLAPSED_PILL_HEIGHT,
                    }}
                  />
                ))}
              </div>

              <div
                className="flex items-center justify-end gap-2 transition-[opacity,transform]"
                style={{
                  opacity: desktopExpanded ? 1 : 0,
                  transform: desktopExpanded ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.96)',
                  transformOrigin: 'bottom right',
                  pointerEvents: desktopExpanded ? 'auto' : 'none',
                  transitionDuration: `${DESKTOP_TRANSITION_MS}ms`,
                  transitionTimingFunction: DESKTOP_EASE,
                }}
              >
                {BUTTONS.map((button, index) => (
                  <div
                    key={button.id}
                    className="relative h-8 shrink-0"
                    style={{
                      width: DESKTOP_SLOT_WIDTH,
                      opacity: desktopExpanded ? 1 : 0,
                      transform: desktopExpanded ? 'translateY(0)' : 'translateY(4px)',
                      transition: `opacity ${DESKTOP_TRANSITION_MS}ms ${DESKTOP_EASE}, transform ${DESKTOP_TRANSITION_MS}ms ${DESKTOP_EASE}`,
                      transitionDelay: desktopExpanded ? `${index * 30}ms` : '0ms',
                    }}
                  >
                    <AccessButton
                      label={button.label}
                      onClick={() => handleAction(button.id)}
                      dimmed={Boolean(hoveredId && hoveredId !== button.id)}
                      onHoverChange={(isHovering) => setHoveredId(isHovering ? button.id : null)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/78 px-3 py-3 backdrop-blur transition-opacity duration-200 ${visibilityClass} ${isMobileViewport ? 'block' : 'hidden'}`}>
        <div className={`grid grid-cols-3 ${isCompactMobileViewport ? 'gap-1.5' : 'gap-2'}`}>
          {BUTTONS.map((button) => (
            <AccessButton
              key={button.id}
              label={button.label}
              onClick={() => handleAction(button.id)}
              dimmed={false}
              onHoverChange={() => {}}
              mobile
              compactMobile={isCompactMobileViewport}
            />
          ))}
        </div>
      </div>
    </>
  )
}
