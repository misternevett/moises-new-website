import { useState } from 'react'
import CaseStudyAnchors from './CaseStudyAnchors.jsx'
import CaseStudyBody from './CaseStudyBody.jsx'
import CaseStudyMetaPanel from './CaseStudyMetaPanel.jsx'

const DIDOT_FONT = '"Didot", "Bodoni 72", "Times New Roman", serif'

function HeroMedia({ caseStudy, onOpenMedia }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-[1.5rem] bg-[#efefeb] text-xs uppercase tracking-[0.24em] text-black/38">
        Hero unavailable
      </div>
    )
  }

  if (caseStudy.heroMediaType === 'video') {
    return (
      <button
        type="button"
        onClick={() =>
          onOpenMedia?.({
            src: caseStudy.heroImage,
            mediaType: caseStudy.heroMediaType,
            alt: `${caseStudy.brand} hero`,
          })
        }
        className="block w-full cursor-pointer bg-transparent p-0"
        aria-label="Open media fullscreen"
      >
        <video
          src={caseStudy.heroImage}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="block w-full rounded-[1.5rem] bg-[#efefeb] object-contain"
          onError={() => setFailed(true)}
        />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() =>
        onOpenMedia?.({
          src: caseStudy.heroImage,
          mediaType: caseStudy.heroMediaType,
          alt: `${caseStudy.brand} hero`,
        })
      }
      className="block w-full cursor-pointer bg-transparent p-0"
      aria-label="Open media fullscreen"
    >
      <img
        src={caseStudy.heroImage}
        alt={`${caseStudy.brand} hero`}
        className="block w-full rounded-[1.5rem] bg-[#efefeb] object-contain"
        draggable={false}
        onError={() => setFailed(true)}
      />
    </button>
  )
}

export default function CaseStudyDetail({
  caseStudy,
  onAnchorSelect,
  onOpenMedia,
}) {
  return (
    <article className="space-y-10 md:space-y-12">
      <div className="space-y-3 text-center">
        <h2
          className="text-[28px] leading-[1.05] text-black md:text-[32px]"
          style={{ fontFamily: DIDOT_FONT, fontWeight: 400 }}
        >
          {`Case study: ${caseStudy.brand}`}
        </h2>
        <p
          className="mx-auto max-w-[34rem] text-[15px] leading-[1.55] text-black/72 md:text-[16px]"
          style={{ fontFamily: DIDOT_FONT, fontWeight: 400 }}
        >
          {caseStudy.tagline}
        </p>
      </div>

      <HeroMedia caseStudy={caseStudy} onOpenMedia={onOpenMedia} />

      <CaseStudyMetaPanel meta={caseStudy.meta} />

      <CaseStudyAnchors
        anchors={caseStudy.processAnchors}
        onSelect={onAnchorSelect}
      />

      <CaseStudyBody
        sections={caseStudy.body}
        reflections={caseStudy.reflections}
        onOpenMedia={onOpenMedia}
      />
    </article>
  )
}
