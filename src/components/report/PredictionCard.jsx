import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { predictCandidateSuccess } from '@/lib/predictionEngine'

export default function PredictionCard({ evaluation }) {
  const { t, lang } = useI18n()
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPrediction() {
      if (!evaluation) return
      setLoading(true)
      const res = await predictCandidateSuccess(evaluation, lang)
      setPrediction(res)
      setLoading(false)
    }
    fetchPrediction()
  }, [evaluation, lang])

  if (loading) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-white/10 animate-pulse flex flex-col items-center justify-center min-h-[200px]">
        <i className="fa-solid fa-microchip text-3xl text-primary/50 mb-4" />
        <p className="text-sm text-muted-foreground">{t('prediction.loading') || 'Generating AI Predictive Models...'}</p>
      </div>
    )
  }

  if (!prediction) return null

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6 rounded-xl border border-primary/20 bg-gradient-to-br from-background to-primary/5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16" />
      
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <i className="fa-solid fa-crystal-ball text-primary" />
        {t('prediction.title') || 'AI Success Prediction'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 relative z-10">
        <div className="bg-background/40 p-4 rounded-lg border border-white/5">
          <p className="text-xs text-muted-foreground mb-1 font-mono uppercase">{t('prediction.retention') || '1-Year Retention'}</p>
          <p className="text-2xl font-black text-emerald-400">{prediction.retentionProbability}%</p>
        </div>
        <div className="bg-background/40 p-4 rounded-lg border border-white/5">
          <p className="text-xs text-muted-foreground mb-1 font-mono uppercase">{t('prediction.promotion') || '2-Yr Promotion Prob'}</p>
          <p className="text-2xl font-black text-amber-400">{prediction.promotionProbability}%</p>
        </div>
        <div className="bg-background/40 p-4 rounded-lg border border-white/5">
          <p className="text-xs text-muted-foreground mb-1 font-mono uppercase">{t('prediction.velocity') || 'Code Velocity'}</p>
          <p className="text-2xl font-black text-blue-400">{prediction.velocityMultiplier}</p>
        </div>
      </div>
      
      <div className="text-sm text-foreground/80 bg-primary/10 p-3 rounded-md border-l-2 border-primary relative z-10">
        <i className="fa-solid fa-robot mr-2 text-primary" />
        {prediction.rationale}
      </div>
    </motion.div>
  )
}
