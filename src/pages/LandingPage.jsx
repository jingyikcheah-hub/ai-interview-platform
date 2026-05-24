import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

export default function LandingPage() {
  const { loginWithGithub, loginAsGuest } = useAuth()
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const [statCounts, setStatCounts] = useState({ interviews: 0, engineers: 0, accuracy: 0 })

  // Real-time counter effect
  useEffect(() => {
    let currentTimer = null;
    
    const animateTo = (start, targets) => {
      if (currentTimer) clearInterval(currentTimer);
      const duration = 1500;
      const steps = 40;
      const interval = duration / steps;
      let step = 0;
      
      currentTimer = setInterval(() => {
        step++;
        const progress = Math.min(step / steps, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        
        setStatCounts({
          interviews: Math.floor(start.interviews + (targets.interviews - start.interviews) * eased),
          engineers: Math.floor(start.engineers + (targets.engineers - start.engineers) * eased),
          accuracy: Math.floor(start.accuracy + (targets.accuracy - start.accuracy) * eased),
        });
        
        if (step >= steps) clearInterval(currentTimer);
      }, interval);
    };

    const fetchRealStats = async (startVals = { interviews: 0, engineers: 0, accuracy: 0 }) => {
      const { data, error } = await supabase.from('interview_reports').select('candidate_email, integrity');
      if (!error && data) {
        const uniqueEmails = new Set(data.filter(d => d.candidate_email).map(d => d.candidate_email));
        const total = data.length;
        
        let avgIntegrity = 0;
        if (total > 0) {
          const sum = data.reduce((acc, r) => acc + (r.integrity?.integrityScore || 100), 0);
          avgIntegrity = Math.round(sum / total);
        }

        const targets = { 
          interviews: total,
          engineers: uniqueEmails.size,
          accuracy: avgIntegrity 
        };

        animateTo(startVals, targets);
        return targets;
      }
      return startVals;
    };

    let latestStats = { interviews: 0, engineers: 0, accuracy: 0 };
    fetchRealStats(latestStats).then(t => { latestStats = t });
    
    // Real-time subscription
    const channel = supabase.channel('realtime:landing_stats')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'interview_reports' },
        () => {
          fetchRealStats(latestStats).then(t => { latestStats = t });
        }
      )
      .subscribe();

    return () => {
      if (currentTimer) clearInterval(currentTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const features = [
    {
      icon: 'fa-solid fa-chart-line', // Changed from fa-chart-network
      title: t('landing.feature1.title'),
      desc: t('landing.feature1.desc'),
      gradient: 'from-blue-500/20 to-cyan-500/20',
    },
    {
      icon: 'fa-solid fa-wand-magic-sparkles',
      title: t('landing.feature2.title'),
      desc: t('landing.feature2.desc'),
      gradient: 'from-emerald-500/20 to-teal-500/20',
    },
    {
      icon: 'fa-solid fa-brain', // Changed from fa-crystal-ball
      title: t('landing.feature3.title'),
      desc: t('landing.feature3.desc'),
      gradient: 'from-purple-500/20 to-pink-500/20',
    },
  ]

  const steps = [
    { icon: 'fa-solid fa-cloud-arrow-up', text: t('landing.howit.step1'), num: '01' },
    { icon: 'fa-solid fa-microchip', text: t('landing.howit.step2'), num: '02' },
    { icon: 'fa-solid fa-file-shield', text: t('landing.howit.step3'), num: '03' },
  ]

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 pb-16">

        <motion.div 
          className="relative z-10 max-w-6xl mx-auto px-6 text-center"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              AI-Powered Technical Vetting
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-5xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-6">
            <span className="text-foreground">{t('landing.hero.title')}</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-cyan-400 animate-gradient">
              {t('landing.hero.title2')}
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('landing.hero.subtitle')}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="px-8 py-6 text-base bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 neon-border"
              onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <i className="fa-solid fa-bolt mr-2" />
              {t('landing.hero.cta')}
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-6 text-base border-white/10 hover:bg-white/5"
              onClick={() => navigate('/pricing')}
            >
              {t('landing.hero.cta2')}
              <i className="fa-solid fa-arrow-right ml-2" />
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div variants={fadeUp} className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: statCounts.interviews.toLocaleString(), label: t('landing.stats.interviews') },
              { value: statCounts.engineers.toLocaleString(), label: t('landing.stats.engineers') },
              { value: `${statCounts.accuracy}%`, label: t('landing.stats.accuracy') },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-mono font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            className="grid md:grid-cols-3 gap-6"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            {features.map((feature, i) => (
              <motion.div key={i} variants={fadeUp}>
                <Card className="h-full bg-card/40 border-white/5 hover:border-primary/20 transition-all duration-500 group relative overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <CardHeader className="relative">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl mb-4 group-hover:animate-pulse-glow transition-all">
                      <i className={feature.icon} />
                    </div>
                    <CardTitle className="text-lg font-bold">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 relative border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            {t('landing.howit.title')}
          </motion.h2>
          <motion.div 
            className="grid md:grid-cols-3 gap-8"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {steps.map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl mx-auto mb-4 relative">
                  <i className={step.icon} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{step.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Auth Section */}
      <section id="auth-section" className="py-24 relative border-t border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />
        <div className="max-w-md mx-auto px-6 relative">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-panel neon-border shadow-2xl">
              <CardHeader className="text-center pb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-2xl mx-auto mb-4 animate-pulse-glow">
                  <i className="fa-solid fa-shield-halved" />
                </div>
                <CardTitle className="text-2xl font-black">{t('landing.auth.title')}</CardTitle>
                <CardDescription>{t('landing.auth.subtitle')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  id="btn-guest-login"
                  className="w-full bg-primary/20 hover:bg-primary/40 text-primary border border-primary/50 py-6 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                  onClick={loginAsGuest}
                >
                  <i className="fa-solid fa-user-secret text-xl mr-3" />
                  {lang === 'cn' ? '访客免密体验' : 'Guest Access'}
                </Button>
                <div className="flex items-center gap-2 py-2">
                  <div className="h-px flex-1 bg-white/10" />
                  <span className="text-xs text-muted-foreground">or connect with</span>
                  <div className="h-px flex-1 bg-white/10" />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <Button 
                    id="btn-github-login"
                    className="w-full bg-[#24292F] hover:bg-[#24292F]/80 text-white py-5 transition-all" 
                    onClick={loginWithGithub}
                  >
                    <i className="fa-brands fa-github text-lg mr-2" />
                    GitHub
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CyberVett. {t('brand.tagline.short')}
          </p>
        </div>
      </footer>
    </div>
  )
}
