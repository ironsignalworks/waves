import { memo, useRef } from 'react'
import { MODE_INFO } from '../lib/VisualizerEngine'
import type { VizMode } from '../lib/VisualizerEngine'

type Props = {
  inputSource: 'none' | 'mic' | 'file'
  isMicActive: boolean
  fileName: string | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  mode: VizMode
  onToggleMic: () => void
  onSelectFile: (file: File | null) => void
  onTogglePlayPause: () => void
  onSetVolume: (v: number) => void
  onSetMode: (m: VizMode) => void
  onReset: () => void
  onToggleFullscreen: () => void
  isFullscreen: boolean
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
  volume,
  currentTime,
  duration,
  mode,
  onToggleMic,
  onSelectFile,
  onTogglePlayPause,
  onSetVolume,
  onSetMode,
  onReset,
  onToggleFullscreen,
  isFullscreen,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modes = Object.entries(MODE_INFO) as [VizMode, { label: string; description: string }][]

  return (
    <div className="absolute bottom-4 left-4 right-4 flex justify-center z-10">
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-black/40 backdrop-blur-sm border border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMic}
            disabled={inputSource === 'file'}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${
              isMicActive ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20'
            }`}
          >
            {isMicActive ? 'Mic REC' : 'Mic'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={inputSource === 'mic'}
            className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-colors ${
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
        </div>
        {inputSource === 'file' && (
          <>
            <button
              onClick={onTogglePlayPause}
              className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
            >
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <span className="text-xs font-mono text-gray-400">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </>
        )}
        <select
          value={mode}
          onChange={(e) => onSetMode(e.target.value as VizMode)}
          className="px-3 py-1.5 rounded-lg bg-gray-900/95 text-white text-sm font-mono border border-white/20"
        >
          {modes.map(([id, { label }]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-gray-400">Vol</label>
          <input
            type="range"
            min={0}
            max={100}
            value={volume * 100}
            onChange={(e) => onSetVolume(Number(e.target.value) / 100)}
            className="w-20 h-1 rounded-full bg-white/20 accent-green-500"
          />
          <span className="text-xs font-mono w-8">{Math.round(volume * 100)}</span>
        </div>
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
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
          className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-sm"
          title="Reset"
        >
          Reset
        </button>
      </div>
    </div>
  )
})
