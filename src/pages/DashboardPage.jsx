import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useInterview } from '@/contexts/InterviewContext'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { getActiveSessionId } from '@/lib/sessionPersistence'
import ResumeUploader from '@/components/dashboard/ResumeUploader'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { startInterview, resumeInterview } = useInterview()
  const { t, lang } = useI18n()
  const navigate = useNavigate()

  const [events, setEvents] = useState([])
  const [reports, setReports] = useState([])
  const [resumeContext, setResumeContext] = useState('')
  const [skillTags, setSkillTags] = useState([])

  // Event creation dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newOrganizer, setNewOrganizer] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Session recovery
  const [recoverySessionId, setRecoverySessionId] = useState(null)

  useEffect(() => {
    fetchEvents()
    if (user) fetchReports()
    // Check for recoverable session
    const activeId = getActiveSessionId()
    if (activeId) setRecoverySessionId(activeId)
  }, [user])

  const fetchEvents = async () => {
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    if (!error) setEvents(data || [])
  }

  const fetchReports = async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('interview_reports')
      .select('*')
      .eq('candidate_email', user.email)
      .order('created_at', { ascending: false })
    if (!error) setReports(data || [])
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!newTitle || !newOrganizer || !newDescription) return
    setIsSubmitting(true)
    const { error } = await supabase.from('events').insert([{
      title: newTitle,
      organizer: newOrganizer,
      description: newDescription,
    }])
    setIsSubmitting(false)
    if (!error) {
      setIsDialogOpen(false)
      setNewTitle('')
      setNewOrganizer('')
      setNewDescription('')
      fetchEvents()
    }
  }

  const handleLaunchInterview = () => {
    const sessionId = startInterview(resumeContext, lang)
    navigate(`/interview/${sessionId}`)
  }

  const handleResumeSession = () => {
    if (recoverySessionId) {
      const success = resumeInterview(recoverySessionId)
      if (success) {
        navigate(`/interview/${recoverySessionId}`)
      }
    }
    setRecoverySessionId(null)
  }

  const handleContextReady = useCallback((context, tags) => {
    setResumeContext(context)
    setSkillTags(tags)
  }, [])

  const getVerdictColor = (verdict) => {
    switch (verdict) {
      case 'STRONG_HIRE': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'HIRE': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'MAYBE': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'NO_HIRE': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-4 md:px-6 pt-20 pb-12">
      {/* Session Recovery Banner */}
      {recoverySessionId && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-xl glass-panel neon-border flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-rotate-right text-primary animate-pulse" />
            <span className="text-sm">
              {lang === 'en' ? 'An unfinished interview session was detected. Resume where you left off?' : '检测到未完成的面试会话。是否继续上次的面试？'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleResumeSession} className="bg-primary">
              {lang === 'en' ? 'Resume' : '恢复'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRecoverySessionId(null)}>
              {t('common.cancel')}
            </Button>
          </div>
        </motion.div>
      )}

      <motion.div 
        className="grid lg:grid-cols-3 gap-8"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Resume Uploader */}
          <motion.div variants={fadeUp}>
            <ResumeUploader onContextReady={handleContextReady} />
            <Button
              id="btn-launch-interview"
              onClick={handleLaunchInterview}
              className="w-full md:w-auto mt-4 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-8 py-5 text-base"
            >
              <i className="fa-solid fa-bolt mr-2" />
              {t('dash.launch')}
            </Button>
          </motion.div>

          {/* Events Board */}
          <motion.div variants={fadeUp}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-satellite-dish text-primary" />
                {t('dash.events.title')}
              </h2>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" size="sm" className="bg-secondary/80 hover:bg-secondary">
                    <i className="fa-solid fa-plus mr-1" /> {t('dash.events.create')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] glass-panel border-white/10">
                  <DialogHeader>
                    <DialogTitle>{t('events.dialog.title')}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateEvent} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">{t('events.field.title')}</label>
                      <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required className="bg-background/50 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">{t('events.field.org')}</label>
                      <Input value={newOrganizer} onChange={(e) => setNewOrganizer(e.target.value)} required className="bg-background/50 border-white/10" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm text-muted-foreground">{t('events.field.desc')}</label>
                      <Textarea rows={4} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} required className="bg-background/50 border-white/10" />
                    </div>
                    <Button type="submit" className="w-full bg-primary" disabled={isSubmitting}>
                      {isSubmitting ? t('events.submitting') : t('events.submit')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {events.map((event) => (
                <Card key={event.id} className="bg-card/40 border-white/5 hover:border-primary/20 hover:bg-card/60 transition-all duration-300 group">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{event.title}</CardTitle>
                    <CardDescription className="text-primary/80 text-xs mt-1">{event.organizer}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reports Sidebar */}
        <motion.div variants={fadeUp} className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-box-archive text-primary" />
            {t('dash.reports.title')}
          </h2>
          {reports.length === 0 ? (
            <Card className="bg-card/20 border-dashed border-white/10">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                {t('dash.reports.empty')}
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card
                key={report.id}
                className="bg-card/40 border-l-4 border-l-primary border-y-white/5 border-r-white/5 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
                onClick={() => navigate(`/report/${report.id}`)}
              >
                <CardHeader className="p-4 pb-2 flex-row justify-between items-start space-y-0">
                  <div>
                    <CardTitle className="text-sm font-bold">{t('report.title')}</CardTitle>
                    {report.evaluation?.verdict && (
                      <span className={`inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${getVerdictColor(report.evaluation.verdict)}`}>
                        {t(`report.verdict.${report.evaluation.verdict}`)}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-background/50 px-2 py-0.5 rounded border border-white/5">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </CardHeader>
                <CardContent className="p-4 pt-2 flex items-center justify-between">
                  <span className="text-2xl font-mono font-bold text-foreground">
                    {report.evaluation?.overallScore || report.chat_history?.filter(m => m.role === 'user').length || 0}
                    <span className="text-xs font-sans font-normal text-muted-foreground ml-1">
                      {report.evaluation?.overallScore ? '/100' : t('dash.reports.rounds')}
                    </span>
                  </span>
                  <i className="fa-solid fa-chevron-right text-muted-foreground text-xs" />
                </CardContent>
              </Card>
            ))
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
