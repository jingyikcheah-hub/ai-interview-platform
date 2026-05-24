import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useInterview } from '@/contexts/InterviewContext'
import { useI18n } from '@/lib/i18n'
import ParticleBackground from '@/components/effects/ParticleBackground'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function CandidateWelcomePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { startInterview } = useInterview()
  const { t, lang } = useI18n()
  const { user } = useAuth()
  
  const [isStarting, setIsStarting] = useState(false)

  // Extract config from URL
  const b64Data = searchParams.get('data')
  const autoStart = searchParams.get('autoStart')
  let inviteConfig = { jobTitle: 'Software Engineer', resumeContext: '' }
  try {
    if (b64Data) {
      inviteConfig = JSON.parse(atob(b64Data))
    }
  } catch(e) {
    console.error("Invalid invite link")
  }

  const handleGithubLogin = async () => {
    setIsStarting(true)
    // Save invite config to localStorage to resume after auth fallback
    localStorage.setItem('pendingInvite', JSON.stringify({
      data: searchParams.get('data'),
      timestamp: Date.now()
    }))
    await supabase.auth.signInWithOAuth({ 
      provider: 'github',
      options: { redirectTo: window.location.href }
    })
  }

  const handleStart = useCallback(() => {
    if (!user) {
      alert("Please login with GitHub first.")
      return
    }
    setIsStarting(true)
    
    // Start interview context
    const customConfig = {
      jobTitle: inviteConfig.jobTitle,
      weights: {
        architecture: 20,
        fundamentals: 20,
        security: 10,
        code_quality: 20,
        problem_solving: 15,
        communication: 15,
      }
    }
    
    const sid = startInterview(inviteConfig.resumeContext, lang, customConfig)
    
    // Navigate to candidate room
    setTimeout(() => {
      navigate(`/c-interview/${sid}?email=${encodeURIComponent(user.email)}`)
    }, 1500)
  }, [user, inviteConfig, lang, startInterview, navigate])

  // Auto-start if redirected back from GitHub auth
  useEffect(() => {
    if (autoStart === 'true' && user && !isStarting) {
      handleStart()
    }
  }, [autoStart, user, handleStart, isStarting])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <ParticleBackground className="absolute inset-0 opacity-40 pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 w-full max-w-md px-4"
      >
        <Card className="backdrop-blur-xl bg-card/60 border border-white/10 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
              <i className="fa-solid fa-user-astronaut text-3xl text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t('candidate.welcome.title')}
            </CardTitle>
            <CardDescription className="text-sm mt-2">
              {t('candidate.welcome.invited')} <br/>
              <span className="text-primary font-semibold text-lg">{inviteConfig.jobTitle}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('candidate.welcome.verify.title')}</label>
              {!user ? (
                <Button 
                  onClick={handleGithubLogin}
                  disabled={isStarting}
                  className="w-full bg-[#24292F] hover:bg-[#24292F]/80 text-white py-6 transition-all"
                >
                  {isStarting ? (
                    <><i className="fa-solid fa-circle-notch fa-spin mr-2" /> {t('candidate.welcome.verify.redirecting')}</>
                  ) : (
                    <><i className="fa-brands fa-github text-lg mr-2" /> {t('candidate.welcome.verify.github')}</>
                  )}
                </Button>
              ) : (
                <div className="bg-background/50 border border-emerald-500/30 rounded-md py-4 px-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <i className="fa-brands fa-github" />
                    </div>
                    <span className="text-sm font-medium text-emerald-400">{user.email}</span>
                  </div>
                  <i className="fa-solid fa-check text-emerald-500" />
                </div>
              )}
            </div>
            
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex gap-3 text-sm">
              <i className="fa-solid fa-shield-halved text-primary mt-0.5" />
              <div className="text-muted-foreground text-xs leading-relaxed">
                <strong className="text-primary block mb-1">{t('candidate.welcome.privacy.title')}</strong>
                {t('candidate.welcome.privacy.desc')}
              </div>
            </div>

            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 font-bold shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all"
              onClick={handleStart}
              disabled={isStarting || !user}
            >
              {isStarting && user ? (
                <><i className="fa-solid fa-circle-notch fa-spin mr-2" /> {t('common.loading')}</>
              ) : (
                <>{t('candidate.welcome.start')} <i className="fa-solid fa-arrow-right ml-2" /></>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
