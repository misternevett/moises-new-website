import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export default function VideoTakeover({ src, onClose, onFinished }) {
  const videoRef = useRef(null)
  const idleTimer = useRef(null)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showLoader, setShowLoader] = useState(false)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    setLoading(true)
    setShowLoader(false)
    const timer = setTimeout(() => setShowLoader(true), 200)
    return () => clearTimeout(timer)
  }, [src])

  useEffect(() => {
    const video = videoRef.current
    if (video) video.play().catch(() => {})

    const handleEnded = () => {
      if (onFinished) {
        setFadingOut(true)
        setTimeout(() => onFinished(), 300)
      } else {
        onClose?.()
      }
    }

    const handleReady = () => setLoading(false)

    video?.addEventListener('ended', handleEnded)
    video?.addEventListener('loadeddata', handleReady)

    return () => {
      video?.removeEventListener('ended', handleEnded)
      video?.removeEventListener('loadeddata', handleReady)
    }
  }, [onClose, onFinished])

  useEffect(() => {
    const scheduleHide = (delay) => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      idleTimer.current = setTimeout(() => setControlsVisible(false), delay)
    }

    scheduleHide(500)

    const onMove = () => {
      setControlsVisible(true)
      scheduleHide(2500)
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('touchstart', onMove, { passive: true })
    window.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('touchstart', onMove)
      window.removeEventListener('keydown', onKeyDown)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
  }, [onClose])

  const play = () => videoRef.current?.play()
  const pause = () => videoRef.current?.pause()
  const stop = () => {
    if (!videoRef.current) return
    videoRef.current.pause()
    videoRef.current.currentTime = 0
  }
  const restart = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = 0
    videoRef.current.play()
  }

  const handleClose = () => {
    stop()
    onClose?.()
  }

  const overlay = (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black transition-opacity duration-300 ${fadingOut ? 'opacity-0' : 'opacity-100'}`}>
      <button
        onClick={handleClose}
        className={`absolute right-4 top-4 z-50 h-7 w-7 rounded-md border border-white/10 bg-black/40 text-gray-200 leading-none transition-opacity duration-300 ${
          controlsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-label="Close"
        title="Close"
        style={{ fontSize: '12px' }}
      >
        ×
      </button>

      <video ref={videoRef} src={src} autoPlay playsInline className="z-40 h-full w-full object-contain" />

      <div
        className={`absolute bottom-6 left-1/2 z-50 flex -translate-x-1/2 gap-2 transition-opacity duration-300 ${
          controlsVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        style={{ fontSize: '9px' }}
      >
        <button onClick={play} className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-gray-200 hover:bg-black/50">Play</button>
        <button onClick={pause} className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-gray-200 hover:bg-black/50">Pause</button>
        <button onClick={restart} className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-gray-200 hover:bg-black/50">Restart</button>
        <button onClick={stop} className="rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-gray-200 hover:bg-black/50">Stop</button>
      </div>

      {loading && showLoader && <ClockLoader />}
    </div>
  )

  if (typeof document === 'undefined') {
    return overlay
  }

  return createPortal(overlay, document.body)
}

function ClockLoader() {
  return (
    <>
      <style>{`
        .clock-wrap {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #000;
        }
        .clock-loader {
          --clock-color: #fff;
          --clock-width: 4rem;
          --clock-radius: calc(var(--clock-width) / 2);
          --clock-minute-length: calc(var(--clock-width) * 0.4);
          --clock-hour-length: calc(var(--clock-width) * 0.2);
          --clock-thickness: 0.2rem;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: var(--clock-width);
          height: var(--clock-width);
          border: 3px solid var(--clock-color);
          border-radius: 50%;
        }
        .clock-loader::before,
        .clock-loader::after {
          position: absolute;
          content: "";
          top: calc(var(--clock-radius) * 0.25);
          width: var(--clock-thickness);
          background: var(--clock-color);
          border-radius: 10px;
          transform-origin: center calc(100% - calc(var(--clock-thickness) / 2));
          animation: spin infinite linear;
        }
        .clock-loader::before {
          height: var(--clock-minute-length);
          animation-duration: 2s;
        }
        .clock-loader::after {
          top: calc(var(--clock-radius) * 0.25 + var(--clock-hour-length));
          height: var(--clock-hour-length);
          animation-duration: 15s;
        }
        @keyframes spin {
          to {
            transform: rotate(1turn);
          }
        }
      `}</style>

      <div className="clock-wrap pointer-events-none">
        <div className="clock-loader" />
      </div>
    </>
  )
}
