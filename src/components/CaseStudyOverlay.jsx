import { useEffect, useState } from 'react'
import { caseStudies } from '../data/caseStudies.js'
import CaseStudyTabs from './CaseStudyTabs.jsx'

export default function CaseStudyOverlay({ onClose }) {
  const [activeId, setActiveId] = useState(caseStudies[0]?.id)
  const activeCaseStudy = caseStudies.find((item) => item.id === activeId) || caseStudies[0]

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/96">
      <div className="min-h-screen px-5 pb-20 pt-5 md:px-8 md:pb-10 md:pt-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-start justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">Protected Notes</p>
              <h2 className="mt-3 text-[clamp(2rem,4vw,4rem)] font-light leading-[0.95] tracking-[-0.05em] text-white">
                Case Studies
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-sm text-white/55 transition hover:text-white"
            >
              Close
            </button>
          </div>

          <CaseStudyTabs
            tabs={caseStudies}
            activeId={activeId}
            onChange={setActiveId}
          />

          {activeCaseStudy && (
            <div className="mt-8 grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <div className="space-y-6">
                <h3 className="text-[clamp(1.75rem,3vw,3rem)] font-light leading-tight tracking-[-0.04em] text-white">
                  {activeCaseStudy.title}
                </h3>
                <p className="max-w-2xl text-sm leading-7 text-white/68">
                  {activeCaseStudy.intro}
                </p>
                <div className="grid gap-3">
                  {activeCaseStudy.highlights.map((highlight) => (
                    <div key={highlight} className="border border-white/10 bg-white/[0.02] px-4 py-4 text-sm leading-6 text-white/72">
                      {highlight}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-white/10 bg-white/[0.02] p-6">
                <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">Placeholder Block</p>
                <p className="mt-5 text-sm leading-7 text-white/68">
                  {activeCaseStudy.notes}
                </p>
                <div className="mt-8 aspect-[4/5] border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
