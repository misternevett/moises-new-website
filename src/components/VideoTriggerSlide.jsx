import { useState } from 'react'
import VideoTakeover from './VideoTakeover.jsx'

const STAGE_RATIO = 3603 / 2030
const DESKTOP_STAGE_MAX_HEIGHT = 'calc(100vh - 5rem)'

function getDesktopStageStyle(aspectRatio) {
  return {
    aspectRatio: `${aspectRatio}`,
    width: `min(92vw, calc((100vh - 5rem) * ${aspectRatio}))`,
    height: `min(${DESKTOP_STAGE_MAX_HEIGHT}, calc(92vw / ${aspectRatio}))`,
  }
}

export default function VideoTriggerSlide({ slide, mode, onRequestNext }) {
  const [open, setOpen] = useState(false)
  const interactive = mode === 'desktop'

  return (
    <>
      <article
        className={`relative overflow-hidden bg-white ${
          interactive
            ? 'flex h-full w-full items-center justify-center px-10 py-10'
            : 'block w-full bg-white px-2 py-0'
        }`}
      >
        <div
          className={`relative w-full overflow-hidden bg-white ${
            interactive ? '' : 'mx-auto max-w-3xl'
          }`}
          style={interactive ? getDesktopStageStyle(STAGE_RATIO) : { aspectRatio: `${STAGE_RATIO}` }}
        >
          <img
            src={slide.imageSrc}
            alt={slide.alt || slide.title}
            className="h-full w-full object-contain"
            draggable={false}
          />

          <button
            type="button"
            aria-label="Open Slide 03 video takeover"
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer bg-transparent ${
              interactive ? 'h-[54%] w-[40%]' : 'h-[56%] w-[42%]'
            }`}
            onClick={(event) => {
              event.stopPropagation()
              setOpen(true)
            }}
          />
        </div>
      </article>

      {open && (
        <VideoTakeover
          src={slide.videoSrc}
          onClose={() => setOpen(false)}
          onFinished={() => {
            setOpen(false)
            onRequestNext?.()
          }}
        />
      )}
    </>
  )
}
