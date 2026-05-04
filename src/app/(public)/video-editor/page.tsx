'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface TextOverlay {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  startTime: number
  endTime: number
}

export default function VideoEditorPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [overlays, setOverlays] = useState<TextOverlay[]>([])
  const [newOverlayText, setNewOverlayText] = useState('')
  const [newOverlayColor, setNewOverlayColor] = useState('#ffffff')
  const [newOverlayFontSize, setNewOverlayFontSize] = useState(32)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'trim' | 'text'>('trim')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('video/')) return
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    const url = URL.createObjectURL(file)
    setVideoFile(file)
    setVideoUrl(url)
    setTrimStart(0)
    setTrimEnd(0)
    setOverlays([])
    setCurrentTime(0)
  }, [videoUrl])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const dur = videoRef.current.duration
      setDuration(dur)
      setTrimEnd(dur)
    }
  }, [])

  const onTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      const t = videoRef.current.currentTime
      setCurrentTime(t)
      if (t >= trimEnd) {
        videoRef.current.pause()
        videoRef.current.currentTime = trimStart
        setIsPlaying(false)
      }
    }
  }, [trimEnd, trimStart])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      if (videoRef.current.currentTime < trimStart || videoRef.current.currentTime >= trimEnd) {
        videoRef.current.currentTime = trimStart
      }
      videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [trimStart, trimEnd])

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const addOverlay = useCallback(() => {
    if (!newOverlayText.trim()) return
    const overlay: TextOverlay = {
      id: crypto.randomUUID(),
      text: newOverlayText,
      x: 50,
      y: 80,
      fontSize: newOverlayFontSize,
      color: newOverlayColor,
      startTime: trimStart,
      endTime: trimEnd,
    }
    setOverlays(prev => [...prev, overlay])
    setNewOverlayText('')
  }, [newOverlayText, newOverlayColor, newOverlayFontSize, trimStart, trimEnd])

  const removeOverlay = useCallback((id: string) => {
    setOverlays(prev => prev.filter(o => o.id !== id))
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`
  }

  const exportVideo = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !videoFile) return
    setIsExporting(true)
    setExportProgress(0)

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const stream = canvas.captureStream(30)

    // Capture audio from the video element
    let combinedStream = stream
    try {
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaElementSource(video)
      const dest = audioCtx.createMediaStreamDestination()
      source.connect(dest)
      source.connect(audioCtx.destination)
      const audioTrack = dest.stream.getAudioTracks()[0]
      if (audioTrack) {
        combinedStream = new MediaStream([
          ...stream.getVideoTracks(),
          audioTrack,
        ])
      }
    } catch {
      // If audio capture fails, proceed with video only
    }

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm',
    })

    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `edited-${videoFile.name.replace(/\.[^.]+$/, '')}.webm`
      a.click()
      URL.revokeObjectURL(url)
      setIsExporting(false)
      setExportProgress(100)
    }

    video.currentTime = trimStart
    await new Promise<void>(resolve => {
      video.onseeked = () => resolve()
    })

    recorder.start()

    const totalDuration = trimEnd - trimStart
    const drawFrame = () => {
      if (video.currentTime >= trimEnd || video.paused) {
        recorder.stop()
        video.pause()
        return
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Draw text overlays
      overlays.forEach(overlay => {
        if (video.currentTime >= overlay.startTime && video.currentTime <= overlay.endTime) {
          ctx.font = `bold ${overlay.fontSize}px sans-serif`
          ctx.fillStyle = overlay.color
          ctx.textAlign = 'center'
          ctx.strokeStyle = 'rgba(0,0,0,0.7)'
          ctx.lineWidth = 3
          const x = (overlay.x / 100) * canvas.width
          const y = (overlay.y / 100) * canvas.height
          ctx.strokeText(overlay.text, x, y)
          ctx.fillText(overlay.text, x, y)
        }
      })

      const progress = ((video.currentTime - trimStart) / totalDuration) * 100
      setExportProgress(Math.min(Math.round(progress), 99))
      requestAnimationFrame(drawFrame)
    }

    video.play()
    drawFrame()
  }, [videoFile, trimStart, trimEnd, overlays])

  // Draw overlay preview on canvas while editing
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !videoUrl) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const video = videoRef.current
    if (!ctx) return

    const draw = () => {
      if (video.videoWidth) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        overlays.forEach(overlay => {
          if (currentTime >= overlay.startTime && currentTime <= overlay.endTime) {
            ctx.font = `bold ${overlay.fontSize}px sans-serif`
            ctx.fillStyle = overlay.color
            ctx.textAlign = 'center'
            ctx.strokeStyle = 'rgba(0,0,0,0.7)'
            ctx.lineWidth = 3
            const x = (overlay.x / 100) * canvas.width
            const y = (overlay.y / 100) * canvas.height
            ctx.strokeText(overlay.text, x, y)
            ctx.fillText(overlay.text, x, y)
          }
        })
      }
    }

    if (!isExporting) {
      const id = requestAnimationFrame(draw)
      return () => cancelAnimationFrame(id)
    }
  }, [currentTime, overlays, videoUrl, isExporting])

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-foreground">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Video Editor</h1>
          {videoFile && (
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">{videoFile.name}</span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        {/* Upload Area */}
        {!videoUrl && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
              flex flex-col items-center justify-center py-24 sm:py-32
              ${isDragging
                ? 'border-blue-500 bg-blue-500/5'
                : 'border-zinc-700 hover:border-zinc-500 bg-card'
              }
            `}
          >
            <svg className="w-12 h-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <p className="text-muted-foreground text-lg font-medium">Drop a video file here</p>
            <p className="text-muted-foreground text-sm mt-1">or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        )}

        {/* Video Player */}
        {videoUrl && (
          <>
            <div className="relative bg-card rounded-xl overflow-hidden">
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={onTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full max-h-[60vh] object-contain"
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Overlay Preview Indicators */}
              {overlays.map(overlay => (
                currentTime >= overlay.startTime && currentTime <= overlay.endTime && (
                  <div
                    key={overlay.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${overlay.x}%`,
                      top: `${overlay.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: `${Math.max(overlay.fontSize * 0.5, 14)}px`,
                      color: overlay.color,
                      fontWeight: 'bold',
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                    }}
                  >
                    {overlay.text}
                  </div>
                )
              ))}

              {/* Play/Pause Overlay */}
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center group"
              >
                <div className={`
                  w-16 h-16 rounded-full bg-foreground/30 backdrop-blur-sm flex items-center justify-center
                  transition-opacity duration-200
                  ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}
                `}>
                  {isPlaying ? (
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </div>
              </button>
            </div>

            {/* Timeline */}
            <div className="bg-card rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Scrubber */}
              <div className="relative h-2 bg-muted rounded-full cursor-pointer group"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const pct = (e.clientX - rect.left) / rect.width
                  seekTo(pct * duration)
                }}
              >
                {/* Trim region */}
                <div
                  className="absolute h-full bg-blue-500/20 rounded-full"
                  style={{
                    left: `${(trimStart / duration) * 100}%`,
                    width: `${((trimEnd - trimStart) / duration) * 100}%`,
                  }}
                />
                {/* Playhead */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg transition-transform group-hover:scale-125"
                  style={{ left: `calc(${(currentTime / duration) * 100}% - 7px)` }}
                />
              </div>
            </div>

            {/* Controls Tabs */}
            <div className="bg-card rounded-xl overflow-hidden">
              <div className="flex border-b border-zinc-800">
                <button
                  onClick={() => setActiveTab('trim')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'trim' ? 'text-white bg-muted' : 'text-muted-foreground hover:text-muted-foreground'
                  }`}
                >
                  Trim
                </button>
                <button
                  onClick={() => setActiveTab('text')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'text' ? 'text-white bg-muted' : 'text-muted-foreground hover:text-muted-foreground'
                  }`}
                >
                  Text Overlay
                </button>
              </div>

              <div className="p-4 sm:p-5">
                {/* Trim Controls */}
                {activeTab === 'trim' && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-muted-foreground">Start</label>
                        <span className="text-sm font-mono text-muted-foreground">{formatTime(trimStart)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        step={0.1}
                        value={trimStart}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          setTrimStart(Math.min(v, trimEnd - 0.1))
                          seekTo(v)
                        }}
                        className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:hover:bg-blue-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm text-muted-foreground">End</label>
                        <span className="text-sm font-mono text-muted-foreground">{formatTime(trimEnd)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        step={0.1}
                        value={trimEnd}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value)
                          setTrimEnd(Math.max(v, trimStart + 0.1))
                          seekTo(v)
                        }}
                        className="w-full h-1.5 bg-muted rounded-full appearance-none cursor-pointer
                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:cursor-pointer
                          [&::-webkit-slider-thumb]:hover:bg-blue-400"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>Selected duration:</span>
                      <span className="font-mono text-muted-foreground">{formatTime(trimEnd - trimStart)}</span>
                    </div>
                  </div>
                )}

                {/* Text Overlay Controls */}
                {activeTab === 'text' && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={newOverlayText}
                        onChange={(e) => setNewOverlayText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addOverlay()}
                        placeholder="Enter caption text..."
                        className="flex-1 bg-muted border border-zinc-700 rounded-lg px-3 py-2.5 text-sm
                          text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={newOverlayColor}
                          onChange={(e) => setNewOverlayColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer bg-muted border border-zinc-700 p-0.5"
                        />
                        <select
                          value={newOverlayFontSize}
                          onChange={(e) => setNewOverlayFontSize(parseInt(e.target.value))}
                          className="bg-muted border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white
                            focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value={18}>Small</option>
                          <option value={32}>Medium</option>
                          <option value={48}>Large</option>
                          <option value={64}>XL</option>
                        </select>
                        <button
                          onClick={addOverlay}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Overlay List */}
                    {overlays.length === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">No text overlays added yet</p>
                    ) : (
                      <div className="space-y-2">
                        {overlays.map((overlay) => (
                          <div
                            key={overlay.id}
                            className="flex items-center justify-between bg-muted border border-zinc-800 rounded-lg px-3 py-2.5"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: overlay.color }}
                              />
                              <span className="text-sm text-foreground truncate">{overlay.text}</span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
                                {formatTime(overlay.startTime)} - {formatTime(overlay.endTime)}
                              </span>
                            </div>
                            <button
                              onClick={() => removeOverlay(overlay.id)}
                              className="text-muted-foreground hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Export Section */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={exportVideo}
                disabled={isExporting}
                className={`
                  flex-1 sm:flex-none px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200
                  ${isExporting
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-[0.98]'
                  }
                `}
              >
                {isExporting ? `Exporting... ${exportProgress}%` : 'Export Video'}
              </button>

              {isExporting && (
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              )}

              <button
                onClick={() => {
                  if (videoUrl) URL.revokeObjectURL(videoUrl)
                  setVideoFile(null)
                  setVideoUrl(null)
                  setDuration(0)
                  setCurrentTime(0)
                  setTrimStart(0)
                  setTrimEnd(0)
                  setOverlays([])
                  setIsPlaying(false)
                }}
                className="px-4 py-3 rounded-xl text-sm text-muted-foreground hover:text-muted-foreground border border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                New Video
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
