import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { useI18n } from '@/lib/i18n'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

const plans = [
  {
    key: 'free',
    icon: 'fa-solid fa-binoculars',
    popular: false,
    features: [
      { en: '3 interviews / month', cn: '每月 3 次面试' },
      { en: 'Basic radar report', cn: '基础雷达报告' },
      { en: 'Markdown code rendering', cn: 'Markdown 代码渲染' },
      { en: 'Community support', cn: '社区支持' },
    ],
  },
  {
    key: 'pro',
    icon: 'fa-solid fa-user-secret',
    popular: true,
    features: [
      { en: 'Unlimited interviews', cn: '无限次面试' },
      { en: 'Full radar + integrity report', cn: '完整雷达 + 诚信度报告' },
      { en: 'Monaco code sandbox', cn: 'Monaco 代码沙盒' },
      { en: 'Anti-cheat monitoring', cn: '反作弊监控' },
      { en: 'PDF resume parsing', cn: 'PDF 简历解析' },
      { en: 'GitHub profile scanning', cn: 'GitHub 档案扫描' },
      { en: 'Priority support', cn: '优先支持' },
    ],
  },
  {
    key: 'enterprise',
    icon: 'fa-solid fa-building-shield',
    popular: false,
    features: [
      { en: 'Everything in Pro', cn: '包含 Pro 版所有功能' },
      { en: 'Custom question banks', cn: '定制化题库' },
      { en: 'Team management dashboard', cn: '团队管理面板' },
      { en: 'API access', cn: 'API 接口' },
      { en: 'SSO / SAML integration', cn: 'SSO / SAML 集成' },
      { en: 'Candidate ranking & comparison', cn: '候选人排名与对比' },
      { en: 'Dedicated account manager', cn: '专属客户经理' },
      { en: 'SLA guarantee', cn: 'SLA 保障' },
    ],
  },
]

export default function PricingPage() {
  const { user, loginWithGithub } = useAuth()
  const { t, lang } = useI18n()

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-black mb-4">{t('pricing.title')}</h1>
          <p className="text-lg text-muted-foreground">{t('pricing.subtitle')}</p>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          className="grid md:grid-cols-3 gap-6 items-start"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.15 } } }}
        >
          {plans.map((plan) => (
            <motion.div key={plan.key} variants={fadeUp}>
              <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                plan.popular 
                  ? 'neon-border bg-card/60 scale-[1.02] shadow-lg shadow-primary/10' 
                  : 'bg-card/30 border-white/5 hover:border-primary/20'
              }`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl ${
                    plan.popular 
                      ? 'bg-primary/20 text-primary border border-primary/30 animate-pulse-glow' 
                      : 'bg-muted text-muted-foreground border border-white/10'
                  }`}>
                    <i className={plan.icon} />
                  </div>
                  <CardTitle className="text-lg font-bold">{t(`pricing.${plan.key}.name`)}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-black text-foreground">{t(`pricing.${plan.key}.price`)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{t(`pricing.${plan.key}.desc`)}</p>
                </CardHeader>
                <CardContent className="space-y-3 pb-6">
                  <div className="h-px bg-white/5 mb-4" />
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <i className={`fa-solid fa-check mt-0.5 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-foreground/80">{lang === 'en' ? feature.en : feature.cn}</span>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Button
                      id={`btn-plan-${plan.key}`}
                      className={`w-full py-5 ${
                        plan.popular
                          ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                      onClick={() => {
                        if (!user) loginWithGithub()
                      }}
                    >
                      {t(`pricing.cta.${plan.key}`)}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="mt-24 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-center mb-8">FAQ</h2>
          <div className="space-y-4">
            {[
              {
                q: lang === 'en' ? 'Can I try CyberVett for free?' : '我可以免费试用 CyberVett 吗？',
                a: lang === 'en' ? 'Yes! The Recon plan gives you 3 free interviews per month with basic radar reports. No credit card required.' : '当然！侦察版每月提供 3 次免费面试和基础雷达报告，无需信用卡。',
              },
              {
                q: lang === 'en' ? 'How does the AI interview work?' : 'AI 面试是如何工作的？',
                a: lang === 'en' ? 'CyberVett uses Google Gemini to conduct adaptive technical interviews. It analyzes your resume/GitHub profile and generates targeted questions about your actual experience.' : 'CyberVett 使用 Google Gemini 进行自适应技术面试。它会分析你的简历/GitHub 档案，并针对你的实际经验生成精准问题。',
              },
              {
                q: lang === 'en' ? 'Is the anti-cheat system invasive?' : '反作弊系统会侵犯隐私吗？',
                a: lang === 'en' ? 'No. We only monitor browser-level events (tab switches, paste events) during the interview. No webcam, no screen recording, no system access.' : '不会。我们仅在面试期间监控浏览器级别事件（标签页切换、粘贴事件）。不使用摄像头、不录屏、不访问系统。',
              },
            ].map((faq, i) => (
              <details key={i} className="group">
                <summary className="flex items-center justify-between p-4 rounded-xl bg-card/30 border border-white/5 cursor-pointer hover:bg-card/50 transition-colors">
                  <span className="font-medium text-sm">{faq.q}</span>
                  <i className="fa-solid fa-chevron-down text-xs text-muted-foreground group-open:rotate-180 transition-transform" />
                </summary>
                <p className="px-4 py-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
