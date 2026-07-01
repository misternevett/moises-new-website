import { useState } from 'react'

function buildGridColumns(segmentWidths) {
  return segmentWidths.map((width) => `${width}fr`).join(' ')
}

function getJoinOverlaps(slide, interactive, segmentCount) {
  const configuredJoinOverlaps = interactive
    ? slide.desktopJoinOverlapsPx
    : slide.mobileJoinOverlapsPx ?? slide.desktopJoinOverlapsPx

  if (configuredJoinOverlaps?.length === segmentCount - 1) {
    return configuredJoinOverlaps
  }

  const seamOverlapPx = interactive
    ? slide.seamOverlapPx ?? 0
    : slide.mobileSeamOverlapPx ?? slide.seamOverlapPx ?? 0

  return Array.from({ length: Math.max(segmentCount - 1, 0) }, () => seamOverlapPx)
}

function getSegmentImageStyle(index, count, joinOverlaps) {
  const overlapLeft = index === 0 ? 0 : (joinOverlaps[index - 1] ?? 0)
  const overlapRight = index === count - 1 ? 0 : (joinOverlaps[index] ?? 0)

  return {
    width: `calc(100% + ${overlapLeft + overlapRight}px)`,
    height: '100%',
    maxWidth: 'none',
    marginLeft: overlapLeft === 0 ? 0 : `-${overlapLeft}px`,
  }
}

function SegmentImage({ src, alt, style }) {
  return (
    <img
      src={src}
      alt={alt}
      className="block h-full w-full max-w-none object-fill"
      style={style}
      draggable={false}
    />
  )
}

export default function SegmentedToggleSlide({ slide, mode }) {
  const interactive = mode === 'desktop'
  const segmentWidths = slide.segments.map((segment) => segment.width ?? 1)
  const stageWidth = segmentWidths.reduce((total, width) => total + width, 0)
  const stageHeight = slide.stageHeight ?? 2030
  const gridTemplateColumns = buildGridColumns(segmentWidths)
  const joinOverlaps = getJoinOverlaps(slide, interactive, slide.segments.length)
  const [states, setStates] = useState(() => slide.segments.map(() => 1))

  const toggleSegment = (segmentIndex) => {
    if (!interactive) return

    setStates((currentStates) =>
      currentStates.map((state, index) =>
        index === segmentIndex ? (state === 1 ? 2 : 1) : state,
      ),
    )
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
        style={{ aspectRatio: `${stageWidth} / ${stageHeight}` }}
      >
        <div
          className="grid h-full w-full items-stretch"
          style={{ gridTemplateColumns }}
        >
          {slide.segments.map((segment, index) => (
            <div
              key={segment.id}
              className="relative h-full min-w-0 overflow-visible"
              style={{ zIndex: slide.segments.length - index }}
            >
              <SegmentImage
                src={states[index] === 1 ? segment.stateOneSrc : segment.stateTwoSrc}
                alt={segment.alt}
                style={getSegmentImageStyle(index, slide.segments.length, joinOverlaps)}
              />
            </div>
          ))}
        </div>

        {interactive ? (
          <div
            className="absolute inset-0 z-20 grid h-full w-full items-stretch"
            style={{ gridTemplateColumns }}
          >
            {slide.segments.map((segment, index) => (
              <div
                key={`${segment.id}-hit-area`}
                aria-label={segment.label}
                className="h-full min-w-0"
                onMouseEnter={() => toggleSegment(index)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}
