import { useState } from 'react'
import { CONTACT } from '../config.js'

export default function ExpiredScreen({ reason }) {
  const [copied, setCopied] = useState(false)

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1400)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
      <div className="max-w-lg border border-white/10 bg-white/[0.02] px-8 py-10 text-center">
        <p className="text-[10px] uppercase tracking-[0.35em] text-white/45">
          {reason === 'expired' ? 'Access Expired' : 'Request Access'}
        </p>
        <h1 className="mt-4 text-[clamp(2rem,5vw,3.75rem)] font-light leading-[0.95] tracking-[-0.05em] text-white">
          Private portfolio
        </h1>
        <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-white/66">
          {reason === 'expired'
            ? 'This timed link has expired. Please request a fresh access window to continue viewing the site.'
            : 'A valid share token is required to view this site. Request access and return with a timed link.'}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={copyEmail}
            className="rounded-full border border-white/15 px-5 py-2 text-[11px] uppercase tracking-[0.28em] text-white/78 transition hover:border-white/35 hover:text-white"
          >
            {copied ? 'Email Copied' : 'Copy Email'}
          </button>
          <a
            href={CONTACT.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-white/15 px-5 py-2 text-[11px] uppercase tracking-[0.28em] text-white/78 transition hover:border-white/35 hover:text-white"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </div>
  )
}
