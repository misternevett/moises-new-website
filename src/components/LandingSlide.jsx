import { useEffect, useRef, useState } from 'react'
import SegmentedToggleSlide from './SegmentedToggleSlide.jsx'
import VideoTriggerSlide from './VideoTriggerSlide.jsx'
import VerticalStateSlide from './VerticalStateSlide.jsx'

const STATIC_STAGE_RATIO = '3600 / 2030'
const HOTSPOT_TOOLTIP_TIMEOUT_MS = 1700

function isVideo(src) {
  return /\.mp4($|\?)/i.test(src)
}

function AssetMedia({ src, alt }) {
  if (isVideo(src)) {
    return (
      <video
        key={src}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
      />
    )
  }

  return <img src={src} alt={alt} className="h-full w-full object-cover" draggable={false} />
}

function DesktopAsset({ asset, slideTitle }) {
  const [hovered, setHovered] = useState(false)
  const src = hovered && asset.hoverSrc ? asset.hoverSrc : asset.defaultSrc

  return (
    <div
      className={`absolute overflow-hidden ${asset.className || ''}`}
      style={asset.desktop}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <AssetMedia src={src} alt={`${slideTitle} asset`} />
    </div>
  )
}

function MobileAsset({ asset, slideTitle }) {
  return (
    <div className={`overflow-hidden ${asset.className || ''}`}>
      <div className="aspect-[4/5] w-full bg-white/5">
        <AssetMedia src={asset.defaultSrc} alt={`${slideTitle} asset`} />
      </div>
    </div>
  )
}

function renderHotspotStyle(hotspot) {
  return {
    left: hotspot.x,
    top: hotspot.y,
    width: hotspot.width,
    height: hotspot.height,
  }
}

function HotspotTooltip({ message }) {
  return (
    <span className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-[calc(100%+0.6rem)] whitespace-nowrap rounded-full bg-black/80 px-3 py-1 text-[11px] font-light tracking-[0.02em] text-white shadow-[0_6px_18px_rgba(0,0,0,0.18)] transition-opacity duration-300">
      {message}
    </span>
  )
}

function StaticImageHotspots({ hotspots, mode }) {
  const [tooltipState, setTooltipState] = useState(null)
  const timeoutRef = useRef(null)
  const isDesktop = mode === 'desktop'

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const showTooltip = (hotspotId, message) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setTooltipState({ hotspotId, message })
    timeoutRef.current = setTimeout(() => {
      setTooltipState(null)
      timeoutRef.current = null
    }, HOTSPOT_TOOLTIP_TIMEOUT_MS)
  }

  const handleCopy = async (event, hotspot) => {
    event.preventDefault()
    event.stopPropagation()

    try {
      await navigator.clipboard.writeText(hotspot.value)
      showTooltip(hotspot.id, hotspot.successMessage || 'Email copied')
    } catch {
      showTooltip(hotspot.id, hotspot.failureMessage || 'Copy failed')
    }
  }

  return hotspots.map((hotspot) => {
    const tooltipVisible = tooltipState?.hotspotId === hotspot.id
    const commonProps = {
      'aria-label': hotspot.ariaLabel,
      className: `absolute z-10 block cursor-pointer rounded-[2px] bg-transparent outline-none transition-opacity duration-200 ${
        isDesktop ? 'hover:opacity-100' : ''
      }`,
      style: renderHotspotStyle(hotspot),
      onClick: (event) => event.stopPropagation(),
    }

    if (hotspot.action === 'copy') {
      return (
        <button
          key={hotspot.id}
          type="button"
          {...commonProps}
          onClick={(event) => handleCopy(event, hotspot)}
        >
          {tooltipVisible ? <HotspotTooltip message={tooltipState.message} /> : null}
        </button>
      )
    }

    return (
      <a
        key={hotspot.id}
        href={hotspot.href}
        target="_blank"
        rel="noopener noreferrer"
        {...commonProps}
      >
        {tooltipVisible ? <HotspotTooltip message={tooltipState.message} /> : null}
      </a>
    )
  })
}

function StaticImageSlide({ slide, mode }) {
  const stageClasses =
    mode === 'desktop'
      ? 'max-h-[calc(100vh-5rem)] max-w-[min(92vw,1600px)]'
      : 'max-w-3xl'
  const articleClasses =
    mode === 'desktop'
      ? 'flex h-full w-full items-center justify-center px-10 py-10'
      : 'flex min-h-screen items-center justify-center px-4 pb-28 pt-16'

  return (
    <article className={`relative overflow-hidden bg-white ${articleClasses}`}>
      <div
        className={`relative w-full overflow-hidden bg-white ${stageClasses}`}
        style={{ aspectRatio: STATIC_STAGE_RATIO }}
      >
        <img
          src={slide.imageSrc}
          alt={slide.alt}
          className="block h-full w-full object-contain"
          draggable={false}
        />
        {slide.hotspots?.length ? <StaticImageHotspots hotspots={slide.hotspots} mode={mode} /> : null}
      </div>
    </article>
  )
}

export default function LandingSlide({ slide, mode, onRequestNext }) {
  if (slide.type === 'segmented-toggle') {
    return <SegmentedToggleSlide slide={slide} mode={mode} />
  }

  if (slide.type === 'static-image') {
    return <StaticImageSlide slide={slide} mode={mode} />
  }

  if (slide.type === 'video-trigger') {
    return <VideoTriggerSlide slide={slide} mode={mode} onRequestNext={onRequestNext} />
  }

  if (slide.type === 'vertical-b-state') {
    return <VerticalStateSlide slide={slide} mode={mode} />
  }

  const mobileAssets = [...slide.assets].sort((a, b) => a.mobileOrder - b.mobileOrder)

  if (mode === 'mobile') {
    return (
      <article className="flex min-h-screen flex-col justify-between gap-8 px-5 pb-28 pt-16">
        <div className="max-w-md space-y-4">
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">{slide.eyebrow}</p>
          <h2 className="max-w-sm text-[clamp(2rem,9vw,3.8rem)] font-light leading-[0.95] tracking-[-0.04em]">
            {slide.title}
          </h2>
          <p className="max-w-xs text-sm leading-6 text-white/65">{slide.description}</p>
        </div>

        <div className="space-y-4">
          {mobileAssets.map((asset) => (
            <MobileAsset key={asset.id} asset={asset} slideTitle={slide.title} />
          ))}
        </div>
      </article>
    )
  }

  return (
    <article className="relative h-full w-full overflow-hidden bg-black px-10 py-10">
      <div className="relative h-full w-full">
        {slide.assets.map((asset) => (
          <DesktopAsset key={asset.id} asset={asset} slideTitle={slide.title} />
        ))}

        <div className="absolute bottom-[12%] left-[8%] z-10 max-w-[32rem]">
          <p className="mb-4 text-[10px] uppercase tracking-[0.35em] text-white/45">{slide.eyebrow}</p>
          <h2 className="max-w-[26rem] text-[clamp(2.5rem,5vw,5.25rem)] font-light leading-[0.95] tracking-[-0.045em] text-white">
            {slide.title}
          </h2>
          <p className="mt-5 max-w-[24rem] text-sm leading-6 text-white/60">
            {slide.description}
          </p>
        </div>
      </div>
    </article>
  )
}
