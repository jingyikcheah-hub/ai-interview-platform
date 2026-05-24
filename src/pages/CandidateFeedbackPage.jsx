import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useI18n } from '@/lib/i18n'
import ParticleBackground from '@/components/effects/ParticleBackground'
import CyberLoadingScreen from '@/components/effects/CyberLoadingScreen'

export default function CandidateFeedbackPage() {
  const { reportId } = useParams()
  const { t } = useI18n()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReport = async () => {
      try {
        if (reportId.startsWith('local-')) {
          const localData = localStorage.getItem(`report_${reportId}`)
          if (localData) {
            setReport(JSON.parse(localData))
          } else {
            throw new Error('Local report not found')
          }
          return
        }

        const { data, error } = await supabase
          .from('interview_reports')
          .select('*')
          .eq('id', reportId)
          .single()

        if (error) throw error
        setReport(data)
      } catch (err) {
        console.error('Failed to load feedback', err)
      } finally {
        setLoading(false)
      }
    }

    if (reportId) fetchReport()
  }, [reportId])

  if (loading) {
    return <CyberLoadingScreen message="Analyzing your performance..." />
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Report Not Found</h2>
          <p className="text-muted-foreground mb-6">The interview report could not be found or has expired.</p>
          <Link to="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { evaluation } = report

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden py-20 px-4">
      <ParticleBackground className="fixed inset-0 z-0 opacity-30 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        
        <div className="text-center space-y-4 mb-12">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
          >
            <i className="fa-solid fa-check text-4xl text-emerald-400" />
          </motion.div>
          <h1 className="text-4xl font-bold tracking-tight">{t('candidate.feedback.title')}</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {t('candidate.feedback.thanks')}
          </p>
        </div>

        {/* CTO Letter */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
          <Card className="bg-card/60 backdrop-blur-md border-primary/20 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <i className="fa-solid fa-envelope-open-text text-primary" />
                {t('candidate.feedback.letter')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-background/50 rounded-lg italic text-muted-foreground/90 leading-relaxed border border-white/5">
                "{evaluation?.personalizedFeedbackLetter || evaluation?.feedbackLetter || 'We appreciate your effort in this interview. You demonstrated good technical foundation.'}"
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Strengths */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card/60 backdrop-blur-md border-emerald-500/20 h-full">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-400 flex items-center gap-2">
                  <i className="fa-solid fa-arrow-trend-up" />
                  {t('candidate.feedback.strengths')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {(evaluation?.keyStrengths || evaluation?.strengths)?.map((strength, i) => (
                    <li key={i} className="flex gap-3">
                      <i className="fa-solid fa-star text-emerald-500 text-xs mt-1.5 opacity-70" />
                      <span className="text-sm leading-relaxed">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Improvements */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
            <Card className="bg-card/60 backdrop-blur-md border-amber-500/20 h-full">
              <CardHeader>
                <CardTitle className="text-lg text-amber-400 flex items-center gap-2">
                  <i className="fa-solid fa-bullseye" />
                  {t('candidate.feedback.improvements')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {(evaluation?.areasForImprovement || evaluation?.improvements)?.map((area, i) => (
                    <li key={i} className="flex gap-3">
                      <i className="fa-solid fa-wrench text-amber-500 text-xs mt-1.5 opacity-70" />
                      <span className="text-sm leading-relaxed">{area}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.5 }}
          className="text-center pt-8"
        >
          <Link to="/">
            <Button variant="outline" className="border-white/10">Return to Homepage</Button>
          </Link>
        </motion.div>

      </div>
    </div>
  )
}
