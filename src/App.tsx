import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Visualizer } from './components/Visualizer'
import { ControlBar } from './components/ControlBar'
import { useAudio } from './hooks/useAudio'
import type { VizMode } from './lib/VisualizerEngine'

function App() {
  const [mode, setMode] = useState<VizMode>('sphere')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [isRandom, setIsRandom] = useState(false)
  const [resolution, setResolution] = useState<'low' | 'high'>('high')
  const [isAboutOpen, setIsAboutOpen] = useState(false)
  const audio = useAudio()

  const modeOrder = useMemo(
    () => ['sphere', 'waveform', 'bars', 'tunnel', 'galaxy', 'fractals', 'water', 'texture', 'melt'] as VizMode[],
    [],
  )

  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = useCallback(async () => {
    const target = containerRef.current
    const anyDoc = document as any

    try {
      if (document.fullscreenElement || anyDoc.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (anyDoc.webkitExitFullscreen) {
          await anyDoc.webkitExitFullscreen()
        }
      } else if (target) {
        if (target.requestFullscreen) {
          await target.requestFullscreen()
        } else if ((target as any).webkitRequestFullscreen) {
          await (target as any).webkitRequestFullscreen()
        } else {
          setIsFullscreen(prev => !prev)
        }
      } else {
        setIsFullscreen(prev => !prev)
      }
    } catch {
      console.warn('Fullscreen not supported')
      setIsFullscreen(prev => !prev)
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const handleReset = useCallback(() => {
    if (audio.inputSource === 'mic') {
      audio.toggleMic()
    } else {
      audio.selectFile(null)
    }
  }, [audio])

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((z) => Math.max(0.4, +(z - 0.15).toFixed(2)))
  }, [])

  const handleToggleRandom = useCallback(() => {
    setIsRandom((v) => !v)
  }, [])

  const handleNextMode = useCallback(() => {
    setMode((current) => {
      const idx = modeOrder.indexOf(current)
      const next = idx === -1 ? modeOrder[0] : modeOrder[(idx + 1) % modeOrder.length]
      return next
    })
  }, [modeOrder])

  return (
    <div
      ref={containerRef}
      className="overflow-hidden bg-[#0a0e14] fixed inset-0"
    >
      <Visualizer
        mode={mode}
        isFullscreen={isFullscreen}
        level={audio.level}
        frequencyData={audio.frequencyData}
        volume={audio.volume}
        inputSource={audio.inputSource}
        zoom={zoom}
        isRandom={isRandom}
        resolution={resolution}
      />
      {!isFullscreen && (
        <header className="absolute top-0 left-0 right-0 z-10 px-3 py-3 sm:px-4 sm:py-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-sm sm:text-base font-mono font-semibold text-white">Waves</h1>
            <span className="text-[10px] sm:text-xs font-mono text-gray-500 uppercase tracking-wider">
              Audio-Reactive Visualizer
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 sm:mt-0">
            <span className="text-[11px] sm:text-xs font-mono text-gray-500">
              {audio.inputSource === 'mic' ? 'Mic' : audio.inputSource === 'file' ? 'File' : 'None'} ·{' '}
              {audio.isPlaying ? 'Playing' : 'Idle'}
            </span>
            <button
              type="button"
              onClick={() => setIsAboutOpen((open) => !open)}
              className="w-6 h-6 flex items-center justify-center rounded-full border border-white/20 text-[11px] font-mono text-white/80 bg-black/40 hover:bg-white/10"
              aria-label="About Waves"
            >
              i
            </button>
          </div>
        </header>
      )}
      {!isFullscreen && isAboutOpen && (
        <div className="absolute top-16 right-3 sm:right-4 z-20 max-w-xs rounded-xl bg-black/80 border border-white/15 px-3 py-3 sm:px-4 sm:py-3 text-xs sm:text-[13px] text-gray-200 font-mono backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white mb-1">Waves</p>
              <p className="mb-1">
                Audio-reactive 3D visualizer. Use <span className="text-white">Mic</span> or{' '}
                <span className="text-white">File</span> to drive the visuals.
              </p>
              <p>
                Try different <span className="text-white">modes</span>, <span className="text-white">zoom</span>, and{' '}
                <span className="text-white">Auto</span> for evolving motion.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAboutOpen(false)}
              className="ml-2 text-gray-400 hover:text-white text-xs"
              aria-label="Close about"
            >
              ×
            </button>
          </div>
        </div>
      )}
      {!isFullscreen && (
      <ControlBar
        inputSource={audio.inputSource}
        isMicActive={audio.isMicActive}
        fileName={audio.fileName}
        isPlaying={audio.isPlaying}
        volume={audio.volume}
        currentTime={audio.currentTime}
        duration={audio.duration}
        mode={mode}
        zoom={zoom}
        isRandom={isRandom}
        resolution={resolution}
        onToggleResolution={() =>
          setResolution((curr) => (curr === 'high' ? 'low' : 'high'))
        }
        onToggleMic={async () => {
          try {
            await audio.toggleMic()
          } catch {
            alert('Microphone access denied')
          }
        }}
        onSelectFile={audio.selectFile}
        onTogglePlayPause={audio.togglePlayPause}
        onSetVolume={audio.setVolume}
        onSetMode={setMode}
        onNextMode={handleNextMode}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
        onToggleRandom={handleToggleRandom}
      />
      )}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 right-4 z-50 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white/80 backdrop-blur-sm"
          title="Exit fullscreen (ESC)"
          aria-label="Exit fullscreen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
          </svg>
        </button>
      )}
    </div>
  )
}

function Home() {
  return <App />
}

export default function Root() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
