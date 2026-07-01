export default function CaseStudyTabs({ tabs, activeId, onChange }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`whitespace-nowrap rounded-full border px-4 py-2 text-[11px] uppercase tracking-[0.28em] transition ${
            tab.id === activeId
              ? 'border-white/35 bg-white/10 text-white'
              : 'border-white/12 bg-transparent text-white/58 hover:border-white/25 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
