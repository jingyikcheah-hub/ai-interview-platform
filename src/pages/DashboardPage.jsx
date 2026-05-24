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
  const [editingEventId, setEditingEventId] = useState(null)
  const [newTitle, setNewTitle] = useState('')
  const [newOrganizer, setNewOrganizer] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Session recovery
  const [recoverySessionId, setRecoverySessionId] = useState(null)

  // System Health
  const [latency, setLatency] = useState(214)
  const [cheatAttempts, setCheatAttempts] = useState(0)

  useEffect(() => {
    const measureHealth = async () => {
      // 1. Measure real latency to Supabase
      const start = performance.now()
      try {
        await supabase.from('interview_reports').select('id').limit(1)
        setLatency(Math.floor(performance.now() - start))
      } catch (e) {
        setLatency(0)
      }
    }

    const fetchCheatStats = async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const { data, error } = await supabase
        .from('interview_reports')
        .select('integrity')
        .gte('created_at', today.toISOString())
        
      if (!error && data) {
        const totalBlocks = data.reduce((sum, row) => {
          const i = row.integrity || {}
          return sum + (i.tabSwitches || 0) + (i.pasteEvents || 0) + (i.windowBlurs || 0)
        }, 0)
        setCheatAttempts(totalBlocks)
      }
    }

    measureHealth()
    fetchCheatStats()

    const interval = setInterval(measureHealth, 5000)
    
    // Real-time subscription for anti-cheat updates
    const channel = supabase.channel('realtime:dashboard_cheats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'interview_reports' },
        () => fetchCheatStats()
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    if (user) {
      const pendingInvite = localStorage.getItem('pendingInvite')
      if (pendingInvite) {
        try {
          const { data, timestamp } = JSON.parse(pendingInvite)
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            localStorage.removeItem('pendingInvite')
            navigate(`/invite?data=${data}&autoStart=true`)
            return
          }
        } catch (e) {}
        localStorage.removeItem('pendingInvite')
      }
      
      fetchReports()
    }
    // Check for recoverable session
    const activeId = getActiveSessionId()
    if (activeId) setRecoverySessionId(activeId)
  }, [user, navigate])

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
    if (!error && data) {
      const valid = data.filter(r => {
        const letter = r.evaluation?.feedbackLetter || ''
        return !letter.toLowerCase().includes('system error')
      })
      setReports(valid)
    }
  }

  const handleSaveEvent = async (e) => {
    e.preventDefault()
    if (!newTitle || !newOrganizer || !newDescription) return
    setIsSubmitting(true)
    
    let dbError = null;

    if (editingEventId) {
      const { error } = await supabase.from('events').update({
        title: newTitle,
        organizer: newOrganizer,
        description: newDescription,
      }).eq('id', editingEventId)
      dbError = error;
    } else {
      const { error } = await supabase.from('events').insert([{
        title: newTitle,
        organizer: newOrganizer,
        description: newDescription,
        author_email: user?.email || '',
      }])
      dbError = error;
    }
    
    setIsSubmitting(false)
    
    if (dbError) {
      console.error('Supabase Error:', dbError)
      alert('Failed to save event. Database error: ' + dbError.message)
      return // Do not close dialog on error
    }

    setIsDialogOpen(false)
    setEditingEventId(null)
    setNewTitle('')
    setNewOrganizer('')
    setNewDescription('')
    fetchEvents()
  }

  const handleDeleteEvent = async (id) => {
    if (!confirm(lang === 'cn' ? '确定要删除这条招募令吗？' : 'Are you sure you want to delete this event?')) return
    await supabase.from('events').delete().eq('id', id)
    fetchEvents()
  }

  const openCreateDialog = () => {
    setEditingEventId(null)
    setNewTitle('')
    setNewOrganizer('')
    setNewDescription('')
    setIsDialogOpen(true)
  }

  const openEditDialog = (event) => {
    setEditingEventId(event.id)
    setNewTitle(event.title)
    setNewOrganizer(event.organizer)
    setNewDescription(event.description)
    setIsDialogOpen(true)
  }

  const handleLaunchInterview = () => {
    const sessionId = startInterview(resumeContext, lang)
    navigate(`/interview/${sessionId}`)
  }

  const handleGenerateInvite = () => {
    const configData = {
      jobTitle: 'Software Engineer',
      resumeContext: resumeContext || ''
    }
    const b64 = btoa(JSON.stringify(configData))
    const link = `${window.location.origin}/invite?data=${b64}`
    navigator.clipboard.writeText(link)
    alert(lang === 'cn' ? '面试邀请链接已复制到剪贴板！发送给候选人即可开始。' : 'Invite link copied to clipboard! Send to candidate to begin.')
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
    <div className="max-w-7xl mx-auto w-full px-4 md:px-6 pb-12">
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
            <div className="flex flex-wrap gap-4 mt-4">
              <Button
                id="btn-launch-interview"
                onClick={handleLaunchInterview}
                className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 px-8 py-5 text-base"
              >
                <i className="fa-solid fa-bolt mr-2" />
                {t('dash.launch')}
              </Button>
              <Button
                id="btn-generate-invite"
                onClick={handleGenerateInvite}
                variant="outline"
                className="border-primary/50 text-primary hover:bg-primary/10 px-8 py-5 text-base"
              >
                <i className="fa-solid fa-link mr-2" />
                {lang === 'cn' ? '生成候选人邀请链接' : 'Generate Invite Link'}
              </Button>
            </div>
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
                  <Button variant="secondary" size="sm" className="bg-secondary/80 hover:bg-secondary" onClick={openCreateDialog}>
                    <i className="fa-solid fa-plus mr-1" /> {t('dash.events.create')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] glass-panel border-white/10">
                  <DialogHeader>
                    <DialogTitle>{editingEventId ? (lang === 'cn' ? '编辑招募令' : 'Edit Event') : t('events.dialog.title')}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveEvent} className="space-y-4 mt-4">
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
              {events.map((event, index) => (
                <Card key={event.id || index} className="bg-card/40 border-white/5 hover:border-primary/20 hover:bg-card/60 transition-all duration-300 group relative">
                  {user?.email && user.email === event.author_email && event.id && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(event)}>
                        <i className="fa-solid fa-pen text-xs" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteEvent(event.id)}>
                        <i className="fa-solid fa-trash text-xs" />
                      </Button>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base pr-12">{event.title}</CardTitle>
                    <CardDescription className="text-primary/80 text-xs mt-1">{event.organizer}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                      <Button variant="outline" size="sm" className="bg-primary/20 text-primary border-primary/30" onClick={() => {
                        const configData = {
                          jobTitle: event.title,
                          resumeContext: event.description
                        }
                        const b64 = btoa(JSON.stringify(configData))
                        const link = `${window.location.origin}/invite?data=${b64}`
                        navigator.clipboard.writeText(link)
                        alert(lang === 'cn' ? '职位专属面试邀请链接已复制！' : 'Event invite link copied!')
                      }}>
                        <i className="fa-solid fa-link mr-1" /> {lang === 'cn' ? '邀请候选人' : 'Invite'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Reports Sidebar */}
        <motion.div variants={fadeUp} className="space-y-4">
          {/* System Health Module */}
          <div className="mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <i className="fa-solid fa-server text-primary" />
              {lang === 'en' ? 'System Health' : '系统状态监控'}
            </h2>
            <Card className="bg-card/40 border-white/5 overflow-hidden relative group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-primary to-cyan-400" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <CardContent className="p-5 grid grid-cols-3 gap-4 relative z-10">
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{lang === 'en' ? 'AI Engine' : 'AI 核心引擎'}</div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full animate-pulse ${latency > 0 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`} />
                    <span className={`text-sm font-mono font-bold ${latency > 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                      {latency > 0 ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{lang === 'en' ? 'API Latency' : '接口延迟'}</div>
                  <div className="text-sm font-mono font-bold text-white/90">{latency}<span className="text-[10px] text-white/40 ml-0.5">ms</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">{lang === 'en' ? 'Anti-Cheat Blocks' : '今日拦截作弊'}</div>
                  <div className="text-sm font-mono font-bold text-white/90 text-amber-400">{cheatAttempts}<span className="text-[10px] text-amber-400/50 ml-1 font-sans">{lang === 'en' ? 'times' : '次'}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>

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
            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              {reports.map((report) => (
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
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}
