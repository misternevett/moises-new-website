import { useState } from 'react'
import { CONTACT } from '../config.js'

const BUTTONS = [
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'case-studies', label: 'Case Studies' },
  { id: 'misu', label: 'MISU Studio' },
]

function AccessButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-11 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] px-4 text-[11px] uppercase tracking-[0.28em] text-white/78 transition duration-300 hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
    >
      {label}
    </button>
  )
}

export default function BottomAccessNav({ onOpenPortfolio, onOpenCaseStudies }) {
  const [expanded, setExpanded] = useState(false)

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
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 hidden md:block">
        <div
          className="pointer-events-auto relative mx-auto max-w-5xl px-6 pb-5"
          onMouseEnter={() => setExpanded(true)}
          onMouseLeave={() => setExpanded(false)}
        >
          <div className="absolute inset-x-0 -top-16 h-16" />

          <div
            className={`overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/80 backdrop-blur-md transition-all duration-500 ${
              expanded ? 'translate-y-0' : 'translate-y-[calc(100%-18px)]'
            }`}
          >
            <div className="flex justify-center py-3">
              <div className="h-px w-20 bg-white/25" />
            </div>

            <div className={`grid grid-cols-3 gap-3 px-4 pb-4 transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0'}`}>
              {BUTTONS.map((button) => (
                <AccessButton
                  key={button.id}
                  label={button.label}
                  onClick={() => handleAction(button.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/90 px-3 py-3 backdrop-blur md:hidden">
        <div className="grid grid-cols-3 gap-2">
          {BUTTONS.map((button) => (
            <AccessButton
              key={button.id}
              label={button.label}
              onClick={() => handleAction(button.id)}
            />
          ))}
        </div>
      </div>
    </>
  )
}
