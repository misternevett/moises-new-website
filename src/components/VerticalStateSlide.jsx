import { useState } from 'react'

const STAGE_RATIO = '3600 / 2038'
const SECTION_HEIGHTS = [743, 655, 640]
const DESKTOP_SEAM_OVERLAP_PX = 4
const MOBILE_SEAM_OVERLAP_PX = 2

function buildSectionStyle(index, interactive) {
  const overlap = interactive ? DESKTOP_SEAM_OVERLAP_PX : MOBILE_SEAM_OVERLAP_PX
  const lastIndex = SECTION_HEIGHTS.length - 1
  const heightPercent = (SECTION_HEIGHTS[index] / 2038) * 100
  const extraHeight = index === 0 || index === lastIndex ? overlap : overlap * 2

  return {
    flex: `0 0 calc(${heightPercent}% + ${extraHeight}px)`,
    marginTop: index === 0 ? 0 : `-${overlap}px`,
    zIndex: SECTION_HEIGHTS.length - index,
  }
}

function StageImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-fill"
      draggable={false}
    />
  )
}

export default function VerticalStateSlide({ slide, mode }) {
  const interactive = mode === 'desktop'
  const [stateIndex, setStateIndex] = useState(1)

  const sections = [
    {
      id: 'a',
      src: slide.sections.a.src,
      alt: slide.sections.a.alt,
    },
    {
      id: 'b',
      src: slide.sections.b.states[stateIndex],
      alt: slide.sections.b.alt,
    },
    {
      id: 'c',
      src: slide.sections.c.src,
      alt: slide.sections.c.alt,
    },
  ]

  const advanceState = () => {
    if (!interactive) return
    setStateIndex((current) => (current === 3 ? 1 : current + 1))
  }

  return (
    <article
      className={`relative overflow-hidden bg-white ${
        interactive
          ? 'flex h-full w-full items-center justify-center px-10 py-10'
          : 'flex min-h-screen items-center justify-center px-4 pb-28 pt-16'
      }`}
    >
      <div
        className={`relative w-full overflow-hidden bg-white ${
          interactive ? 'max-h-[calc(100vh-5rem)] max-w-[min(92vw,1600px)]' : 'max-w-3xl'
        }`}
        style={{ aspectRatio: STAGE_RATIO }}
      >
        <div className="flex h-full w-full flex-col items-stretch">
          {sections.map((section, index) => (
            <div
              key={section.id}
              className="relative w-full shrink-0 overflow-visible"
              style={buildSectionStyle(index, interactive)}
              onMouseEnter={interactive ? advanceState : undefined}
            >
              <StageImage src={section.src} alt={section.alt} />
            </div>
          ))}
        </div>
      </div>
    </article>
  )
}
