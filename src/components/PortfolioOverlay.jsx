import PortfolioSlideshow from './PortfolioSlideshow.jsx'

export default function PortfolioOverlay({ onClose }) {
  return (
    <div className="fixed inset-0 z-40 bg-black">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-[120] flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-black/70 text-lg text-white/80 transition hover:border-white/30 hover:text-white"
        aria-label="Close portfolio"
      >
        ×
      </button>

      <PortfolioSlideshow />
    </div>
  )
}
