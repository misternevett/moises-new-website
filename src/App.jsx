import { useEffect, useState } from 'react'
import AccessGate from './components/AccessGate.jsx'
import LandingPage from './components/LandingPage.jsx'
import PortfolioOverlay from './components/PortfolioOverlay.jsx'
import PasswordGate from './components/PasswordGate.jsx'
import CaseStudyOverlay from './components/CaseStudyOverlay.jsx'

function readPortfolioHash() {
  const match = window.location.hash.match(/^#(?:\/|portfolio\/)(\d+)$/)
  return match ? parseInt(match[1], 10) : null
}

function clearPortfolioHash() {
  const { pathname, search } = window.location
  window.history.replaceState(null, '', `${pathname}${search}`)
}

export default function App() {
  const [portfolioOpen, setPortfolioOpen] = useState(() => readPortfolioHash() !== null)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [caseStudyOpen, setCaseStudyOpen] = useState(false)
  const [caseStudyUnlocked, setCaseStudyUnlocked] = useState(false)

  useEffect(() => {
    const onHashChange = () => {
      setPortfolioOpen(readPortfolioHash() !== null)
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const openPortfolio = () => {
    setPortfolioOpen(true)
  }

  const closePortfolio = () => {
    setPortfolioOpen(false)
    clearPortfolioHash()
  }

  const openCaseStudies = () => {
    if (caseStudyUnlocked) {
      setCaseStudyOpen(true)
      return
    }

    setPasswordOpen(true)
  }

  const handlePasswordSuccess = () => {
    setCaseStudyUnlocked(true)
    setPasswordOpen(false)
    setCaseStudyOpen(true)
  }

  return (
    <AccessGate>
      <div className="min-h-screen bg-black text-white">
        <LandingPage
          onOpenPortfolio={openPortfolio}
          onOpenCaseStudies={openCaseStudies}
          keyboardNavigationDisabled={portfolioOpen || passwordOpen || caseStudyOpen}
          hideBottomNav={caseStudyOpen}
        />

        {portfolioOpen && <PortfolioOverlay onClose={closePortfolio} />}

        {passwordOpen && (
          <PasswordGate
            onClose={() => setPasswordOpen(false)}
            onSuccess={handlePasswordSuccess}
          />
        )}

        {caseStudyOpen && (
          <CaseStudyOverlay onClose={() => setCaseStudyOpen(false)} />
        )}
      </div>
    </AccessGate>
  )
}
