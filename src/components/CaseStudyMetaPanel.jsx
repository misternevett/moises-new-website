const HELVETICA_FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif'

function MetaItem({ label, value, isList = false }) {
  return (
    <div className="space-y-2">
      <p
        className="text-[12px] uppercase tracking-[0.04em] text-black/52"
        style={{ fontFamily: HELVETICA_FONT, fontWeight: 400 }}
      >
        {label}
      </p>
      {isList ? (
        <ul
          className="space-y-1 text-[12px] leading-6 text-black/76"
          style={{ fontFamily: HELVETICA_FONT, fontWeight: 400 }}
        >
          {value.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p
          className="text-[12px] leading-6 text-black/76"
          style={{ fontFamily: HELVETICA_FONT, fontWeight: 400 }}
        >
          {value}
        </p>
      )}
    </div>
  )
}

export default function CaseStudyMetaPanel({ meta }) {
  return (
    <section className="rounded-[1.35rem] bg-[rgba(198,198,198,0.5)] p-5 md:p-6">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.45fr)_minmax(13rem,0.85fr)] md:gap-x-8">
        <div className="space-y-6">
          <MetaItem label="Background" value={meta.background} />
          <MetaItem label="Problem" value={meta.problem} />
          <MetaItem label="Project Goals" value={meta.projectGoals} />
        </div>

        <div className="space-y-6">
          <MetaItem label="Role" value={meta.role} />
          <MetaItem label="Timeline" value={meta.timeline} />
          <MetaItem label="Tools" value={meta.tools} isList />
        </div>
      </div>
    </section>
  )
}
