import { useState } from 'react'

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

export default function LandingSlide({ slide, mode }) {
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
