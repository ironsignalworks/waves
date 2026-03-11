import { useCallback, useEffect, useRef, useState } from 'react'

export function useAudio() {
  const [inputSource, setInputSource] = useState<'none' | 'mic' | 'file'>('none')
  const [isMicActive, setIsMicActive] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const DEFAULT_VOLUME = 0.7
  const GAIN = 0.5
  const [level, setLevel] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [frequencyData, setFrequencyData] = useState<Uint8Array | undefined>()
  const [error, setError] = useState<string | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const mediaRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const bufferRef = useRef<AudioBufferSourceNode | null>(null)
  const animationRef = useRef<number | null>(null)

  const initContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return ctxRef.current
  }, [])

  const createAnalyser = useCallback(() => {
    const ctx = initContext()
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.8
    const gainNode = ctx.createGain()
    gainNode.gain.value = DEFAULT_VOLUME * GAIN * 4
    analyserRef.current = analyser
    gainRef.current = gainNode
    return { analyser, gainNode }
  }, [initContext])

  const updateLevelAndFreq = useCallback(() => {
    if (!analyserRef.current) return 0
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    const avg = data.reduce((a, b) => a + b, 0) / data.length / 255
    setLevel(avg)
    setFrequencyData(data)
    return avg
  }, [])

  const loopRef = useRef<() => void>()
  const loop = useCallback(() => {
    updateLevelAndFreq()
    animationRef.current = requestAnimationFrame(() => loopRef.current?.())
  }, [updateLevelAndFreq])

  useEffect(() => {
    loopRef.current = loop
  }, [loop])

  const startLoop = useCallback(() => {
    if (animationRef.current) return
    loop()
  }, [loop])

  const stopLoop = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }
    setLevel(0)
    setFrequencyData(undefined)
  }, [])

  const connectSource = useCallback(
    (node: MediaStreamAudioSourceNode | MediaElementAudioSourceNode, { monitorOutput = true } = {}) => {
      sourceRef.current?.disconnect()
      const { analyser, gainNode } = createAnalyser()
      const ctx = ctxRef.current!
      node.connect(gainNode)
      gainNode.connect(analyser)
      if (monitorOutput) {
        analyser.connect(ctx.destination)
      }
      sourceRef.current = node
    },
    [createAnalyser],
  )

  const toggleMic = useCallback(async () => {
    setError(null)
    if (isMicActive) {
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      sourceRef.current?.disconnect()
      sourceRef.current = null
      analyserRef.current = null
      setIsMicActive(false)
      setInputSource('none')
      stopLoop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = initContext()
      await ctx.resume()
      const source = ctx.createMediaStreamSource(stream)
      // Do not route mic audio to speakers to avoid feedback
      connectSource(source, { monitorOutput: false })
      setIsMicActive(true)
      setInputSource('mic')
      setIsPlaying(true)
      setFileName(null)
      startLoop()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Microphone access denied')
      throw e
    }
  }, [isMicActive, initContext, connectSource, startLoop, stopLoop])

  const selectFile = useCallback((file: File | null) => {
    if (!file) {
      if (mediaRef.current) {
        mediaRef.current.pause()
        mediaRef.current.src = ''
      }
      bufferRef.current?.stop()
      sourceRef.current?.disconnect()
      sourceRef.current = null
      analyserRef.current = null
      setInputSource('none')
      setFileName(null)
      setIsPlaying(false)
      setCurrentTime(0)
      setDuration(0)
      stopLoop()
      return
    }
    const url = URL.createObjectURL(file)
    const audio = new Audio(url)
    mediaRef.current = audio
    audio.volume = DEFAULT_VOLUME
    const ctx = initContext()
    const source = ctx.createMediaElementSource(audio)
    connectSource(source, { monitorOutput: true })
    audio.onloadedmetadata = () => setDuration(audio.duration)
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime)
    audio.onended = () => {
      setIsPlaying(false)
      stopLoop()
    }
    audio.play().then(() => {
      setInputSource('file')
      setFileName(file.name)
      setIsPlaying(true)
      setDuration(audio.duration)
      startLoop()
    }).catch(() => setError('Failed to play audio'))
    URL.revokeObjectURL(url)
  }, [initContext, connectSource, startLoop, stopLoop])

  const togglePlayPause = useCallback(() => {
    if (inputSource !== 'file' || !mediaRef.current) return
    if (mediaRef.current.paused) {
      mediaRef.current.play()
      setIsPlaying(true)
      startLoop()
    } else {
      mediaRef.current.pause()
      setIsPlaying(false)
      stopLoop()
    }
  }, [inputSource, startLoop, stopLoop])

  return {
    inputSource,
    isMicActive,
    isPlaying,
    fileName,
    level,
    currentTime,
    duration,
    frequencyData,
    error,
    toggleMic,
    selectFile,
    togglePlayPause,
    startLoop,
    stopLoop,
  }
}
