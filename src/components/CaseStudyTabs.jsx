const HELVETICA_FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'
const DIDOT_FONT = '"Didot", "Bodoni 72", "Times New Roman", serif'

function CaseStudyTabMedia({ src, alt, mediaType }) {
  if (mediaType === 'video') {
    return (
      <video
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="h-full w-full object-cover object-top"
      />
    )
  }

  return <img src={src} alt={alt} className="h-full w-full object-cover object-top" draggable={false} />
}

export default function CaseStudyTabs({
  title,
  tabs,
  activeId,
  onChange,
  hidden = false,
  edgeToEdge = false,
}) {
  if (hidden) {
    return null
  }

  const sectionClassName = edgeToEdge
    ? '-mx-4 rounded-none bg-[rgba(198,198,198,0.5)] px-4 py-4 md:-mx-6 md:px-6 md:py-5'
    : 'rounded-[1.35rem] bg-[rgba(198,198,198,0.5)] px-4 py-4 md:px-5 md:py-5'

  const carouselClassName = edgeToEdge
    ? '-mr-4 overflow-x-auto pl-0 pr-0 pb-1 md:-mr-6'
    : '-mx-1 overflow-x-auto px-1 pb-1 md:-mx-0 md:px-0'

  return (
    <section
      className={sectionClassName}
    >
      <p
        className="mb-4 text-center text-[12px] uppercase leading-none text-black"
        style={{
          fontFamily: HELVETICA_FONT,
          fontWeight: 400,
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </p>

      <div className={carouselClassName}>
        <div className="flex min-w-full gap-3">
          {tabs.map((tab) => {
            const isActive = tab.id === activeId

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  if (!isActive) onChange(tab.id)
                }}
                className={`group relative w-[13.5rem] shrink-0 overflow-hidden rounded-[1rem] border border-black/8 bg-[#f6f4f2] text-left shadow-[0_8px_18px_rgba(0,0,0,0.04)] transition ${
                  isActive
                    ? 'scale-[0.99] opacity-50 saturate-0'
                    : 'opacity-100 hover:-translate-y-0.5 hover:border-black/18 hover:shadow-[0_12px_24px_rgba(0,0,0,0.07)]'
                }`}
                aria-pressed={isActive}
              >
                <div className="h-[9.15rem] w-full overflow-hidden bg-[#ddd9d6]">
                  <CaseStudyTabMedia
                    src={tab.thumbnail}
                    alt={`${tab.brand} thumbnail`}
                    mediaType={tab.thumbnail.endsWith('.mp4') ? 'video' : 'image'}
                  />
                </div>

                <div className="space-y-2 px-3 py-3">
                  <p
                    className="text-[11px] leading-[1.15] text-black"
                    style={{ fontFamily: DIDOT_FONT, fontWeight: 400 }}
                  >
                    {tab.brand}
                  </p>
                  <p
                    className="text-[12px] leading-[1.35] text-black/72"
                    style={{ fontFamily: HELVETICA_FONT, fontWeight: 400 }}
                  >
                    {tab.signpostIntro}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
