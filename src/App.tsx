import { useCallback, useEffect, useRef, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Visualizer } from './components/Visualizer'
import { ControlBar } from './components/ControlBar'
import { useAudio } from './hooks/useAudio'
import type { VizMode } from './lib/VisualizerEngine'

function App() {
  const [mode, setMode] = useState<VizMode>('sphere')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const audio = useAudio()

  const containerRef = useRef<HTMLDivElement>(null)

  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
    } catch {
      console.warn('Fullscreen not supported')
    }
  }, [])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      // Force canvas resize after fullscreen layout settles
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => window.dispatchEvent(new Event('resize')), 150)
        })
      })
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

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden bg-[#0a0e14] relative h-screen w-screen`}
    >
      <Visualizer
        mode={mode}
        isFullscreen={isFullscreen}
        level={audio.level}
        frequencyData={audio.frequencyData}
        volume={audio.volume}
        inputSource={audio.inputSource}
      />
      {!isFullscreen && (
      <header className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between">
        <div>
          <h1 className="text-sm font-mono font-semibold text-white">Waves</h1>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            Audio-Reactive Visualizer
          </span>
        </div>
        <span className="text-xs font-mono text-gray-500">
          {audio.inputSource === 'mic' ? 'Mic' : audio.inputSource === 'file' ? 'File' : 'None'} · {audio.isPlaying ? 'Playing' : 'Idle'}
        </span>
      </header>
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
        onReset={handleReset}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />
      )}
      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-black/50 hover:bg-black/70 text-white/80 backdrop-blur-sm"
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
