import { memo, useEffect, useRef, useState } from 'react'
import { MODE_INFO } from '../lib/VisualizerEngine'
import type { VizMode } from '../lib/VisualizerEngine'

type Props = {
  inputSource: 'none' | 'mic' | 'file'
  isMicActive: boolean
  fileName: string | null
  isPlaying: boolean
  currentTime: number
  duration: number
  mode: VizMode
  zoom: number
  isRandom: boolean
  resolution: 'low' | 'high'
  onToggleMic: () => void
  onSelectFile: (file: File | null) => void
  onTogglePlayPause: () => void
  onSetMode: (m: VizMode) => void
  onNextMode: () => void
  onReset: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onToggleRandom: () => void
  onToggleResolution: () => void
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

export const ControlBar = memo(function ControlBar({
  inputSource,
  isMicActive,
  fileName,
  isPlaying,
  currentTime,
  duration,
  mode,
  isRandom,
  resolution,
  onToggleMic,
  onSelectFile,
  onTogglePlayPause,
  onSetMode,
  onNextMode,
  onReset,
  onToggleFullscreen,
  isFullscreen,
  onZoomIn,
  onZoomOut,
  onToggleRandom,
  onToggleResolution,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modeMenuRef = useRef<HTMLDivElement>(null)
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false)
  const modes = Object.entries(MODE_INFO) as [VizMode, { label: string; description: string }][]
  const selectedMode = modes.find(([id]) => id === mode)?.[1].label ?? 'Mode'

  useEffect(() => {
    if (!isModeMenuOpen) return
    const onPointerDown = (event: MouseEvent) => {
      if (!modeMenuRef.current?.contains(event.target as Node)) {
        setIsModeMenuOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsModeMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isModeMenuOpen])

  return (
    <div className="absolute inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4 flex justify-center z-10 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-[96vw] rounded-xl bg-black/70 backdrop-blur-sm border border-white/10 px-2 py-1.5">
        <div className="flex w-full items-center gap-1.5 flex-nowrap overflow-x-auto whitespace-nowrap">
          <button
            onClick={onToggleMic}
            disabled={inputSource === 'file'}
            className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-mono min-w-[72px] text-center transition-colors flex-shrink-0 ${
              isMicActive ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {isMicActive ? 'Mic REC' : 'Mic'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={inputSource === 'mic'}
            className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-mono transition-colors flex-shrink-0 ${
              inputSource === 'file' ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {fileName ? fileName.slice(0, 12) + (fileName.length > 12 ? '...' : '') : 'File'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
          />
          {inputSource === 'file' && (
            <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-gray-300 flex-shrink-0">
              <button
                onClick={onTogglePlayPause}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] sm:text-xs"
              >
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <span className="whitespace-nowrap opacity-80">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          )}

          <div className="relative flex items-center gap-1 min-w-[120px] sm:min-w-[150px] flex-shrink-0" ref={modeMenuRef}>
            <button
              type="button"
              onClick={() => setIsModeMenuOpen((open) => !open)}
              className="flex-1 flex items-center justify-between gap-2 px-2.5 py-1 rounded-md bg-black/40 text-white text-[11px] sm:text-xs font-mono border border-white/10 hover:bg-white/10 focus:outline-none focus:ring-1 focus:ring-white/30 focus:border-white/30 transition-colors"
              aria-haspopup="listbox"
              aria-expanded={isModeMenuOpen}
              aria-label="Select visualization mode"
            >
              <span className="truncate">{selectedMode}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`text-white/70 transition-transform ${isModeMenuOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {isModeMenuOpen && (
              <div
                role="listbox"
                aria-label="Visualization modes"
                className="absolute left-0 right-0 bottom-full mb-1.5 z-30 max-h-56 overflow-auto rounded-lg bg-black/90 backdrop-blur-sm border border-white/10 p-1 shadow-xl"
              >
                {modes.map(([id, { label }]) => {
                  const isActive = id === mode
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        onSetMode(id)
                        setIsModeMenuOpen(false)
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-sm font-mono transition-colors ${
                        isActive ? 'bg-white/20 text-white' : 'text-gray-200 hover:bg-white/10'
                      }`}
                      role="option"
                      aria-selected={isActive}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onNextMode}
            className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] sm:text-[11px] font-mono flex-shrink-0"
            title="Next mode"
          >
            Next
          </button>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] sm:text-[11px] font-mono text-gray-400">Zoom</span>
              <button
                type="button"
                onClick={onZoomOut}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-mono"
                title="Zoom out"
              >
                -
              </button>
              <button
                type="button"
                onClick={onZoomIn}
                className="w-6 h-6 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-[10px] font-mono"
                title="Zoom in"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
            type="button"
            onClick={onToggleResolution}
            className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] sm:text-[11px] font-mono flex-shrink-0"
            title="Toggle visual resolution"
          >
            Res: {resolution === 'high' ? 'High' : 'Low'}
            </button>
            <button
            onClick={onToggleRandom}
            className={`px-2 py-1 rounded-md text-[10px] sm:text-xs flex-shrink-0 ${
              isRandom ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
            title="Toggle automatic motion and mode changes"
          >
            Auto
            </button>
            <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 flex-shrink-0"
            title={isFullscreen ? 'Exit fullscreen (ESC)' : 'Fullscreen'}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
            )}
            </button>
            <button
            onClick={onReset}
            className="px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[10px] sm:text-xs flex-shrink-0"
            title="Reset"
          >
            Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})
