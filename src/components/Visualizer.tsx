import { memo, useCallback, useEffect, useRef } from 'react'
import type { VizMode } from '../lib/VisualizerEngine'
import { VisualizerEngine } from '../lib/VisualizerEngine'

type Props = {
  mode: VizMode
  level: number
  frequencyData?: Uint8Array
  isFullscreen?: boolean
  inputSource: 'none' | 'mic' | 'file'
  zoom: number
  isRandom: boolean
  resolution: 'low' | 'high'
}


function VisualizerInner(props: Props) {
  const { mode, level, frequencyData, zoom, isRandom, resolution } = props
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<VisualizerEngine | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas) return
    engineRef.current = new VisualizerEngine(canvas)
    engineRef.current.setZoom(zoom)
    engineRef.current.setRandomEnabled(isRandom)
    engineRef.current.setResolution(resolution)
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
    engineRef.current?.setZoom(zoom)
  }, [zoom])

  useEffect(() => {
    engineRef.current?.setRandomEnabled(isRandom)
  }, [isRandom])

  useEffect(() => {
    engineRef.current?.setResolution(resolution)
  }, [resolution])

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

  return (
    <div ref={wrapperRef} className="absolute inset-0 w-full h-full">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block"
        style={{ display: 'block', width: '100%', height: '100%' }}
        aria-label="Waves Visualizer"
      />
    </div>
  )
}

export const Visualizer = memo(VisualizerInner)
