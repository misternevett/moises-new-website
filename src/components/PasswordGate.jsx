import { useEffect, useState } from 'react'
import { CASE_STUDY_PASSWORD } from '../config.js'

export default function PasswordGate({ onClose, onSuccess }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (value === CASE_STUDY_PASSWORD) {
      setError('')
      onSuccess()
      return
    }

    setError('Incorrect password.')
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-6 backdrop-blur-sm">
      <div className="w-full max-w-sm border border-white/10 bg-black px-6 py-7">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">Protected</p>
            <h2 className="mt-3 text-2xl font-light tracking-[-0.04em] text-white">Case Studies</h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-sm text-white/55 transition hover:text-white"
            aria-label="Close password gate"
          >
            Close
          </button>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block text-xs uppercase tracking-[0.3em] text-white/40">
            Password
            <input
              autoFocus
              type="password"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                if (error) setError('')
              }}
              className="mt-3 w-full border border-white/15 bg-transparent px-4 py-3 text-sm text-white outline-none transition focus:border-white/35"
            />
          </label>

          <div className="flex items-center justify-between gap-4">
            <p className="min-h-5 text-xs text-white/45">{error}</p>
            <button
              type="submit"
              className="rounded-full border border-white/15 px-4 py-2 text-[11px] uppercase tracking-[0.28em] text-white/78 transition hover:border-white/35 hover:text-white"
            >
              Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
