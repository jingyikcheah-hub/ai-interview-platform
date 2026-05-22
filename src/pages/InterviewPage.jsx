import { useEffect, useCallback, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useInterview } from '@/contexts/InterviewContext'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { generateEvaluation } from '@/lib/aiEvaluator'
import InterviewRoom from '@/components/interview/InterviewRoom'

export default function InterviewPage() {
  const { sessionId: urlSessionId } = useParams()
  const { user } = useAuth()
  const { sessionId, isActive, messages, config, antiCheatLog, endInterview } = useInterview()
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Redirect if no active session or wrong session
  useEffect(() => {
    if (!isActive && !isGeneratingReport) {
      navigate('/dashboard')
    }
  }, [isActive, navigate, isGeneratingReport])

  // Warn before leaving
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isActive) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isActive])

  const handleGenerateReport = useCallback(async (finalMessages, antiCheatSummary) => {
    setIsGeneratingReport(true)
    try {
      // Generate AI evaluation
      const evaluation = await generateEvaluation(finalMessages, config.resumeContext, lang)

      // Save to Supabase
      const { error } = await supabase.from('interview_reports').insert([{
        candidate_email: user?.email,
        chat_history: finalMessages,
        evaluation: evaluation,
        integrity: antiCheatSummary,
      }])

      if (error) {
        console.error('Failed to save report:', error)
        alert(t('common.error'))
      }
    } catch (err) {
      console.error('Report generation failed:', err)
    } finally {
      setIsGeneratingReport(false)
    }
  }, [user, config.resumeContext, t])

  const handleExit = useCallback(() => {
    endInterview()
    navigate('/dashboard')
  }, [endInterview, navigate])

  if (!user) return null

  return (
    <div className="pt-16 h-screen">
      <InterviewRoom
        userEmail={user.email}
        resumeContext={config.resumeContext}
        onGenerateReport={handleGenerateReport}
        onExit={handleExit}
      />
    </div>
  )
}
