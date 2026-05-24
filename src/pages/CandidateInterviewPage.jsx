import { useEffect, useCallback, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useInterview } from '@/contexts/InterviewContext'
import { supabase } from '@/lib/supabase'
import { generateEvaluation } from '@/lib/aiEvaluator'
import { useI18n } from '@/lib/i18n'
import InterviewRoom from '@/components/interview/InterviewRoom'

export default function CandidateInterviewPage() {
  const { sessionId: urlSessionId } = useParams()
  const { sessionId, isActive, messages, config, antiCheatLog, endInterview } = useInterview()
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [searchParams] = useSearchParams()
  const candidateEmail = searchParams.get('email') || 'candidate@guest.com'

  // Redirect if no active session
  useEffect(() => {
    if (!isActive && !isGeneratingReport) {
      navigate('/')
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
    let newReportId = null;
    try {
      // Generate AI evaluation using correct language
      const evaluation = await generateEvaluation(finalMessages, config.resumeContext, lang, antiCheatSummary, config.customConfig)

      // Save to Supabase (even if they are a guest, we save the report)
      const { data, error } = await supabase.from('interview_reports').insert([{
        candidate_email: candidateEmail,
        chat_history: finalMessages,
        evaluation: evaluation,
        integrity: antiCheatSummary,
      }]).select('id').single()

      if (error) {
        console.warn('Failed to save report to Supabase (likely due to guest auth), falling back to localStorage:', error)
        newReportId = 'local-' + Date.now();
        localStorage.setItem(`report_${newReportId}`, JSON.stringify({
           candidate_email: candidateEmail,
           chat_history: finalMessages,
           evaluation: evaluation,
           integrity: antiCheatSummary
        }));
      } else {
        newReportId = data.id;
      }
    } catch (err) {
      console.error('Report generation failed:', err)
      alert(`${t('common.error')}: ${err.message || 'Failed to generate report'}`)
    } finally {
      setIsGeneratingReport(false)
      // Navigate to candidate feedback instead of admin dashboard
      if (newReportId) {
        navigate(`/candidate-feedback/${newReportId}`)
      }
      // If newReportId is null, do nothing so the user stays on the page and can try clicking End again.
    }
  }, [candidateEmail, config.resumeContext, config.customConfig, navigate, lang, t])

  const handleExit = useCallback(() => {
    endInterview()
    navigate('/')
  }, [endInterview, navigate])

  return (
    <div className="pt-16 min-h-screen flex flex-col pb-8">
      <InterviewRoom
        userEmail={candidateEmail}
        resumeContext={config.resumeContext}
        customConfig={config.customConfig}
        onGenerateReport={handleGenerateReport}
        onExit={handleExit}
      />
    </div>
  )
}
