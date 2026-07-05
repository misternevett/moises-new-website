const DIDOT_FONT = '"Didot", "Bodoni 72", "Times New Roman", serif'
const HELVETICA_FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export default function CaseStudyAnchors({ anchors, onSelect }) {
  return (
    <section className="rounded-[1.35rem] bg-[rgba(198,198,198,0.5)] px-5 py-5 md:px-6 md:py-6">
      <div className="space-y-5 text-left">
        <p
          className="text-center text-[16px] uppercase leading-none text-black"
          style={{ fontFamily: DIDOT_FONT, fontWeight: 400 }}
        >
          THE PROCESS
        </p>
        <div className="grid gap-x-8 gap-y-2 text-left md:grid-cols-2">
          {anchors.map((anchor, index) => (
            <button
              key={anchor.id}
              type="button"
              onClick={() => onSelect(anchor.id)}
              className="border-b border-black/10 pb-2 text-left text-[12px] uppercase tracking-[0.04em] text-black/74 transition hover:text-black"
              style={{ fontFamily: HELVETICA_FONT, fontWeight: 400 }}
            >
              {`${String(index + 1).padStart(2, '0')} ${anchor.label}`}
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
