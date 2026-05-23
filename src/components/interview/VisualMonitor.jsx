import { useState, useEffect, useRef } from 'react'
import { useI18n } from '@/lib/i18n'

export default function VisualMonitor({ onMetricsUpdate, className = '' }) {
  const { lang } = useI18n()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  
  // Real metrics states from backend
  const [focus, setFocus] = useState(100)
  const [stress, setStress] = useState(0)
  const [emotion, setEmotion] = useState('Neutral')
  const [gaze, setGaze] = useState('Centered')
  const [isCameraReady, setIsCameraReady] = useState(false)
  
  const [metricsHistory, setMetricsHistory] = useState({ focus: [], stress: [] })

  useEffect(() => {
    let stream = null

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        setIsCameraReady(true)
      } catch (err) {
        console.error('Failed to access camera:', err)
      }
    }

    startCamera()

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  // Handle video play - start sending frames to backend
  const handleVideoPlay = () => {
    const interval = setInterval(async () => {
      if (!videoRef.current || !canvasRef.current || !isCameraReady) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      // Ensure canvas matches video dimensions
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }

      // Draw current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      // Convert to Base64 JPEG
      const base64Image = canvas.toDataURL('image/jpeg', 0.7)

      try {
        // Use environment variable for production, fallback to localhost for local dev
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
        
        const response = await fetch(`${backendUrl}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64Image })
        })

        if (!response.ok) throw new Error('Backend analysis failed')

        const data = await response.json()

        const newEmotion = data.emotion || 'Neutral'
        const newStress = data.stress ?? 0
        const newFocus = data.focus ?? 100
        const newGaze = data.gaze || 'Centered'

        // Smooth transitions
        setFocus(prev => Math.round(prev * 0.5 + newFocus * 0.5))
        setStress(prev => Math.round(prev * 0.7 + newStress * 0.3))
        setEmotion(newEmotion)
        setGaze(newGaze)

        // Record history
        setMetricsHistory(prev => {
          const updated = {
            focus: [...prev.focus, newFocus],
            stress: [...prev.stress, newStress]
          }
          
          const avgFocus = Math.round(updated.focus.reduce((a, b) => a + b, 0) / updated.focus.length)
          const avgStress = Math.round(updated.stress.reduce((a, b) => a + b, 0) / updated.stress.length)
          
          onMetricsUpdate({
            averageFocus: avgFocus,
            averageStress: avgStress,
            dominantEmotion: avgFocus > 80 ? 'Highly Focused' : 'Variable',
            gazeDeviations: updated.focus.filter(f => f < 40).length
          })

          return updated
        })

      } catch (err) {
        // Backend might be off or failed to process, fallback to generic state
        setGaze('Offline')
      }
    }, 1500) // Send a frame every 1.5 seconds
    
    return () => clearInterval(interval)
  }

  return (
    <div className={`relative overflow-hidden rounded-lg border border-primary/30 bg-black shadow-[0_0_15px_rgba(56,136,255,0.2)] flex items-center justify-center ${className}`}>
      
      {!isCameraReady && (
        <div className="absolute z-10 flex flex-col items-center justify-center text-primary font-mono text-xs animate-pulse">
          <i className="fa-solid fa-camera mb-2 text-xl" />
          <span>INITIALIZING...</span>
        </div>
      )}

      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Feed */}
      <video
        ref={videoRef}
        onPlay={handleVideoPlay}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-1000 ${isCameraReady ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Cyberpunk Scanner Overlay */}
      {isCameraReady && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/50 shadow-[0_0_10px_#3888ff] animate-[scan-line_3s_linear_infinite]" />
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-32 border border-primary/40 rounded-sm transition-all duration-300" style={{ opacity: gaze === 'Centered' ? 1 : 0.3, borderColor: gaze === 'Centered' ? '' : '#ef4444' }}>
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-current" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-current" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-current" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-current" />
          </div>

          <div className="absolute top-2 left-2 text-[10px] font-mono text-primary/80 uppercase tracking-widest leading-tight">
            <div className="mb-1 bg-primary/20 px-1 inline-block text-primary">SYS.V-MONITOR</div>
            <div>{lang === 'en' ? 'TGT.LCK' : '目标锁定'}</div>
          </div>

          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end text-[9px] font-mono text-white/80">
            <div className="space-y-1.5 flex-1 pr-2">
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 w-10 shrink-0">{lang === 'en' ? 'FOCUS' : '专注度'}</span>
                <div className="flex-1 max-w-[60px] h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${focus}%` }} />
                </div>
                <span className="text-emerald-400 w-6 shrink-0 text-right">{focus}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`${stress > 60 ? 'text-amber-400' : 'text-primary'} w-10 shrink-0`}>{lang === 'en' ? 'STRESS' : '压力值'}</span>
                <div className="flex-1 max-w-[60px] h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full transition-all duration-500 bg-primary" style={{ width: `${stress}%`, backgroundColor: stress > 60 ? '#fbbf24' : '#3888ff' }} />
                </div>
                <span className="w-6 shrink-0 text-right">{stress}%</span>
              </div>
            </div>

            <div className="text-right space-y-1 shrink-0">
              <div className={`${(gaze === 'Off-Screen' || gaze === 'Offline') ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                [{gaze}]
              </div>
              <div className="text-primary font-bold uppercase">
                {emotion}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
