import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

export default function VisualMonitor({ onMetricsUpdate, className = '' }) {
  const { lang } = useI18n()
  const videoRef = useRef(null)
  
  // Simulated metrics
  const [focus, setFocus] = useState(95)
  const [stress, setStress] = useState(12)
  const [emotion, setEmotion] = useState('Neutral')
  const [gaze, setGaze] = useState('Centered')
  
  const [metricsHistory, setMetricsHistory] = useState({ focus: [], stress: [] })

  useEffect(() => {
    let stream = null

    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      } catch (err) {
        console.error('Failed to access camera for visual monitoring:', err)
      }
    }

    setupCamera()

    // Simulate real-time visual analysis
    const interval = setInterval(() => {
      const newFocus = Math.min(100, Math.max(0, focus + (Math.random() * 10 - 3))) // Tend to stay high
      const newStress = Math.min(100, Math.max(0, stress + (Math.random() * 8 - 4)))
      
      let newEmotion = 'Neutral'
      if (newStress > 60) newEmotion = 'Anxious'
      else if (newFocus > 90) newEmotion = 'Focused'
      else if (newFocus < 60) newEmotion = 'Distracted'

      setFocus(Math.round(newFocus))
      setStress(Math.round(newStress))
      setEmotion(newEmotion)
      
      // Gaze simulation
      if (Math.random() > 0.95) setGaze('Off-Screen')
      else setGaze('Centered')

      // Record history to send back to parent
      setMetricsHistory(prev => {
        const updated = {
          focus: [...prev.focus, Math.round(newFocus)],
          stress: [...prev.stress, Math.round(newStress)]
        }
        
        // Compute averages and pass up
        const avgFocus = Math.round(updated.focus.reduce((a, b) => a + b, 0) / updated.focus.length)
        const avgStress = Math.round(updated.stress.reduce((a, b) => a + b, 0) / updated.stress.length)
        
        onMetricsUpdate({
          averageFocus: avgFocus,
          averageStress: avgStress,
          dominantEmotion: avgFocus > 85 ? 'Highly Focused' : 'Standard',
          gazeDeviations: updated.focus.filter(f => f < 60).length
        })

        return updated
      })

    }, 2000)

    return () => {
      clearInterval(interval)
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`relative overflow-hidden rounded-lg border border-primary/30 bg-black shadow-[0_0_15px_rgba(56,136,255,0.2)] ${className}`}>
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover opacity-60 mix-blend-screen filter grayscale contrast-125"
      />

      {/* Cyberpunk Scanner Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Scan line */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/50 shadow-[0_0_10px_#3888ff] animate-[scan-line_3s_linear_infinite]" />
        
        {/* Reticle / Face box */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-32 border border-primary/40 rounded-sm">
          <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary" />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-primary" />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-primary" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary" />
        </div>

        {/* HUD Data Overlay */}
        <div className="absolute top-2 left-2 text-[10px] font-mono text-primary/80 uppercase tracking-widest leading-tight">
          <div className="mb-1 bg-primary/20 px-1 inline-block text-primary">SYS.V-MONITOR</div>
          <div>{lang === 'en' ? 'TGT.LCK' : '目标锁定'}</div>
        </div>

        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end text-[9px] font-mono text-white/80">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-400 w-12">{lang === 'en' ? 'FOCUS' : '专注度'}</span>
              <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${focus}%` }} />
              </div>
              <span className="text-emerald-400 w-6 text-right">{focus}%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`${stress > 60 ? 'text-amber-400' : 'text-primary'} w-12`}>{lang === 'en' ? 'STRESS' : '压力值'}</span>
              <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-500 bg-primary" style={{ width: `${stress}%`, backgroundColor: stress > 60 ? '#fbbf24' : '#3888ff' }} />
              </div>
              <span className="w-6 text-right">{stress}%</span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <div className={`${gaze === 'Off-Screen' ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
              [{gaze}]
            </div>
            <div className="text-primary font-bold">
              {emotion}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
