import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import ReportCard from '@/components/report/ReportCard'

export default function ReportPage() {
  const { reportId } = useParams()
  const { user } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user || !reportId) return
    fetchReport()
  }, [user, reportId])

  const fetchReport = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: dbError } = await supabase
        .from('interview_reports')
        .select('*')
        .eq('id', reportId)
        .single()

      if (dbError) throw dbError
      if (!data) throw new Error('Report not found')
      setReport(data)
    } catch (err) {
      console.error('Failed to fetch report:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center"
        >
          <i className="fa-solid fa-circle-notch fa-spin text-4xl text-primary mb-4" />
          <p className="text-muted-foreground text-sm font-mono">{t('common.loading')}</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="text-center space-y-4">
          <i className="fa-solid fa-triangle-exclamation text-4xl text-destructive" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            {t('nav.back')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >

        {report && <ReportCard report={report} />}
      </motion.div>
    </div>
  )
}
