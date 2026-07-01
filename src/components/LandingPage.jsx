import LandingSlideshow from './LandingSlideshow.jsx'
import BottomAccessNav from './BottomAccessNav.jsx'

export default function LandingPage({
  onOpenPortfolio,
  onOpenCaseStudies,
  keyboardNavigationDisabled = false,
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <LandingSlideshow keyboardNavigationDisabled={keyboardNavigationDisabled} />
      <BottomAccessNav
        onOpenPortfolio={onOpenPortfolio}
        onOpenCaseStudies={onOpenCaseStudies}
      />
    </main>
  )
}
