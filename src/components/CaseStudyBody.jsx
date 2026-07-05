import { useState } from 'react'

const DIDOT_FONT = '"Didot", "Bodoni 72", "Times New Roman", serif'
const HELVETICA_FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'

function CaseStudyMedia({ block, onOpenMedia }) {
  const [failed, setFailed] = useState(false)

  if (!block.src || failed) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-[1.25rem] border border-black/10 bg-[#f2f2ee] px-6 text-center text-xs uppercase tracking-[0.22em] text-black/38">
        Asset unavailable
      </div>
    )
  }

  if (block.mediaType === 'video') {
    return (
      <button
        type="button"
        onClick={() =>
          onOpenMedia?.({
            src: block.src,
            mediaType: block.mediaType,
            alt: block.token || 'Case study media',
          })
        }
        className="block w-full cursor-pointer bg-transparent p-0"
        aria-label="Open media fullscreen"
      >
        <video
          src={block.src}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="block w-full rounded-[1.25rem] bg-[#f2f2ee] object-contain"
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
          src: block.src,
          mediaType: block.mediaType,
          alt: block.token || 'Case study media',
        })
      }
      className="block w-full cursor-pointer bg-transparent p-0"
      aria-label="Open media fullscreen"
    >
      <img
        src={block.src}
        alt={block.token || ''}
        className="block w-full rounded-[1.25rem] bg-[#f2f2ee] object-contain"
        draggable={false}
        onError={() => setFailed(true)}
      />
    </button>
  )
}

function BlockRenderer({ block, onOpenMedia }) {
  if (block.type === 'media') {
    return <CaseStudyMedia block={block} onOpenMedia={onOpenMedia} />
  }

  return (
    <p
      className="text-[12px] leading-6 text-black/74 whitespace-pre-line"
      style={{ fontFamily: HELVETICA_FONT, fontWeight: 400 }}
    >
      {block.text}
    </p>
  )
}

export default function CaseStudyBody({ sections, reflections, onOpenMedia }) {
  return (
    <div className="space-y-14 md:space-y-16">
      {sections.map((section, index) => (
        <section
          key={section.id}
          id={section.id}
          className="scroll-mt-28 border-t border-black/8 pt-8"
        >
          <div className="mb-5">
            <h3
              className="text-[16px] leading-tight text-black"
              style={{ fontFamily: DIDOT_FONT, fontWeight: 400 }}
            >
              {`${String(index + 1).padStart(2, '0')} ${section.title}`}
            </h3>
          </div>

          <div className="space-y-6">
            {section.blocks.map((block, index) => (
              <BlockRenderer
                key={`${section.id}-${index}`}
                block={block}
                onOpenMedia={onOpenMedia}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="border-t border-black/8 pt-8">
        <div className="mb-5">
          <h3
            className="text-center text-[16px] uppercase leading-tight text-black"
            style={{ fontFamily: DIDOT_FONT, fontWeight: 400 }}
          >
            Reflections &amp; Takeaways
          </h3>
        </div>

        <div className="space-y-6">
          {reflections.map((block, index) => (
            <BlockRenderer
              key={`reflection-${index}`}
              block={block}
              onOpenMedia={onOpenMedia}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
