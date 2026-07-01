import { useState } from 'react'
import VideoTakeover from './VideoTakeover.jsx'

const STAGE_RATIO = '3603 / 2030'

export default function VideoTriggerSlide({ slide, mode, onRequestNext }) {
  const [open, setOpen] = useState(false)
  const interactive = mode === 'desktop'

  return (
    <>
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
          <img
            src={slide.imageSrc}
            alt={slide.alt || slide.title}
            className="h-full w-full object-cover"
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
