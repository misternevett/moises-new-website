import { useState } from 'react'
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
const COLLAPSED_PILL_WIDTH = '24px'
const COLLAPSED_PILL_HEIGHT = '6px'
const COLLAPSED_PILL_GAP = '9px'

function AccessButton({ label, onClick, dimmed, onHoverChange, mobile = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={mobile ? undefined : () => onHoverChange(true)}
      onMouseLeave={mobile ? undefined : () => onHoverChange(false)}
      className={`flex items-center justify-center overflow-hidden bg-black text-white shadow-[0_2px_4px_rgba(0,0,0,0.25)] ${
        mobile
          ? 'min-h-11 rounded-md border border-white/25 px-3 py-2'
          : 'h-8 w-full rounded-md border border-white/25 px-3 py-2 transition-opacity duration-200'
      } ${dimmed ? 'opacity-40' : 'opacity-100'}`}
      style={{
        fontFamily: BUTTON_FONT,
        fontSize: '11px',
        fontWeight: 400,
        letterSpacing: '0.02em',
      }}
    >
      <span className="whitespace-nowrap uppercase">{label}</span>
    </button>
  )
}

export default function BottomAccessNav({ onOpenPortfolio, onOpenCaseStudies }) {
  const [expanded, setExpanded] = useState(false)
  const [hoveredId, setHoveredId] = useState(null)

  const handleAction = (id) => {
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

  return (
    <>
      <div className="pointer-events-none fixed bottom-0 right-0 z-40 hidden md:block">
        <div
          className="pointer-events-auto relative h-[14vh] min-h-[8rem] w-[40vw] min-w-[26rem]"
          onMouseEnter={() => setExpanded(true)}
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
                  opacity: expanded ? 0 : 1,
                  transform: expanded ? 'translateY(3px) scale(0.96)' : 'translateY(0) scale(1)',
                  transformOrigin: 'bottom right',
                  pointerEvents: expanded ? 'none' : 'auto',
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
                  opacity: expanded ? 1 : 0,
                  transform: expanded ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.96)',
                  transformOrigin: 'bottom right',
                  pointerEvents: expanded ? 'auto' : 'none',
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
                      opacity: expanded ? 1 : 0,
                      transform: expanded ? 'translateY(0)' : 'translateY(4px)',
                      transition: `opacity ${DESKTOP_TRANSITION_MS}ms ${DESKTOP_EASE}, transform ${DESKTOP_TRANSITION_MS}ms ${DESKTOP_EASE}`,
                      transitionDelay: expanded ? `${index * 30}ms` : '0ms',
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

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/78 px-3 py-3 backdrop-blur md:hidden">
        <div className="grid grid-cols-3 gap-2">
          {BUTTONS.map((button) => (
            <AccessButton
              key={button.id}
              label={button.label}
              onClick={() => handleAction(button.id)}
              dimmed={false}
              onHoverChange={() => {}}
              mobile
            />
          ))}
        </div>
      </div>
    </>
  )
}
