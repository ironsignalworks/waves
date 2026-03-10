import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { VizMode } from '../lib/VisualizerEngine'
import { VisualizerEngine } from '../lib/VisualizerEngine'

type Props = {
  mode: VizMode
  level: number
  frequencyData?: Uint8Array
  volume: number
  isFullscreen?: boolean
  inputSource: 'none' | 'mic' | 'file'
}


function VisualizerInner(props: Props) {
  const { mode, level, frequencyData, isFullscreen, inputSource } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [fullscreenSize, setFullscreenSize] = useState({ w: 0, h: 0 })

  useEffect(() => {
    if (!isFullscreen) return
    const update = () => setFullscreenSize({ w: window.innerWidth, h: window.innerHeight })
    update()
    const t = setTimeout(update, 150)
    window.addEventListener('resize', update)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', update)
    }
  }, [isFullscreen])
  const engineRef = useRef<VisualizerEngine | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas) return
    engineRef.current = new VisualizerEngine(canvas)
    // ResizeObserver catches fullscreen/container size changes that window resize misses
    const ro = container
      ? new ResizeObserver(() => {
          requestAnimationFrame(() => engineRef.current?.onResize?.())
        })
      : null
    if (container && ro) ro.observe(container)
    return () => {
      ro?.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      engineRef.current?.dispose()
      engineRef.current = null
    }
  }, [])

  useEffect(() => {
    engineRef.current?.setMode(mode)
  }, [mode])

  const loopRef = useRef<() => void>()
  const loop = useCallback(() => {
    const engine = engineRef.current
    if (!engine) return
    engine.update(level, frequencyData)
    rafRef.current = requestAnimationFrame(() => loopRef.current?.())
  }, [level, frequencyData])

  useEffect(() => {
    loopRef.current = loop
  }, [loop])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(loop)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [loop])

  const fullscreenStyle = isFullscreen && fullscreenSize.h > 0
    ? { width: fullscreenSize.w, height: fullscreenSize.h, minHeight: fullscreenSize.h }
    : isFullscreen
      ? { width: '100vw', height: '100vh', minHeight: '100vh' }
      : undefined

  return (
    <div ref={wrapperRef} className={isFullscreen ? 'fixed inset-0' : 'absolute inset-0 w-full h-full'} style={fullscreenStyle}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ display: 'block', width: '100%', height: '100%' }}
        aria-label="Waves Visualizer"
      />
      {!level && inputSource === 'none' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-6 text-center opacity-60">
          <p className="text-sm text-gray-400 font-mono">
            Click Mic or select a file to start
          </p>
        </div>
      )}
    </div>
  )
}

export const Visualizer = memo(VisualizerInner)
