import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import LandingSlide from './LandingSlide.jsx'
import { assetUrl } from '../utils/assetUrl.js'

const STATIC_STAGE_RATIO = 3600 / 2030
const VIDEO_TRIGGER_RATIO = 3603 / 2030
const VERTICAL_STATE_RATIO = 3600 / 2038
const TAKEOVER_FRAME_PADDING_PX = 24

function getIsPortraitViewport() {
  if (typeof window === 'undefined') return false
  return window.innerHeight > window.innerWidth
}

function getSlideAspectRatio(slide) {
  if (slide?.type === 'segmented-toggle') {
    const stageWidth = slide.segments.reduce(
      (total, segment) => total + (segment.width ?? 1),
      0,
    )
    const stageHeight = slide.stageHeight ?? 2030

    return stageWidth / stageHeight
  }

  if (slide?.type === 'video-trigger') return VIDEO_TRIGGER_RATIO
  if (slide?.type === 'vertical-b-state') return VERTICAL_STATE_RATIO
  if (slide?.type === 'static-image') return STATIC_STAGE_RATIO

  return STATIC_STAGE_RATIO
}

export default function MobileSlideTakeover({ slide, onClose }) {
  const [isPortraitViewport, setIsPortraitViewport] = useState(getIsPortraitViewport)
  const slideAspectRatio = getSlideAspectRatio(slide)

  useEffect(() => {
    const handleResize = () => {
      setIsPortraitViewport(getIsPortraitViewport())
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
      }
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousDocumentOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousDocumentOverflow
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const takeoverViewportStyle = isPortraitViewport
    ? {
        width: '100vh',
        height: '100vw',
        transform: 'translate(-50%, -50%) rotate(90deg)',
        transformOrigin: 'center center',
      }
    : {
        width: '100vw',
        height: '100vh',
        transform: 'translate(-50%, -50%)',
        transformOrigin: 'center center',
      }

  const frameStyle = isPortraitViewport
    ? {
        width: `min(calc(100vh - ${TAKEOVER_FRAME_PADDING_PX * 2}px), calc((100vw - ${TAKEOVER_FRAME_PADDING_PX * 2}px) * ${slideAspectRatio}))`,
        maxWidth: `calc(100vh - ${TAKEOVER_FRAME_PADDING_PX * 2}px)`,
        maxHeight: `calc(100vw - ${TAKEOVER_FRAME_PADDING_PX * 2}px)`,
        aspectRatio: `${slideAspectRatio}`,
      }
    : {
        width: `min(calc(100vw - ${TAKEOVER_FRAME_PADDING_PX * 2}px), calc((100vh - ${TAKEOVER_FRAME_PADDING_PX * 2}px) * ${slideAspectRatio}))`,
        maxWidth: `calc(100vw - ${TAKEOVER_FRAME_PADDING_PX * 2}px)`,
        maxHeight: `calc(100vh - ${TAKEOVER_FRAME_PADDING_PX * 2}px)`,
        aspectRatio: `${slideAspectRatio}`,
      }

  const overlay = (
    <div
      className="fixed inset-0 z-[120] overflow-hidden bg-white"
      onTouchMove={(event) => event.preventDefault()}
      onWheel={(event) => event.preventDefault()}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onClose?.()
        }}
        className="fixed z-[140] rounded-md bg-white/92 p-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.16)]"
        aria-label="Close slide takeover"
        style={{
          right: 'calc(16px + env(safe-area-inset-right))',
          bottom: 'calc(16px + env(safe-area-inset-bottom))',
        }}
      >
        <img
          src={assetUrl('/icons/close-button.png')}
          alt=""
          className="block h-6 w-6 select-none object-contain"
          draggable={false}
        />
      </button>

      <button
        type="button"
        className="absolute inset-0 block overflow-hidden bg-transparent p-0 text-left"
        onClick={() => onClose?.()}
        aria-label="Close slide takeover"
      >
        <div
          className="absolute left-1/2 top-1/2 flex items-center justify-center bg-white"
          style={takeoverViewportStyle}
        >
          <div className="relative overflow-hidden bg-white" style={frameStyle}>
            <LandingSlide slide={slide} mode="mobile-takeover" />
          </div>
        </div>
      </button>
    </div>
  )

  if (typeof document === 'undefined') {
    return overlay
  }

  return createPortal(overlay, document.body)
}
