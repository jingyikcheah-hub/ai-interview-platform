import { createContext, useContext, useState, useCallback } from 'react'

const translations = {
  en: {
    // Brand
    'brand.name': 'CyberVett',
    'brand.tagline': 'AI-Powered Technical Vetting for Elite Engineers',
    'brand.tagline.short': 'Where Code Meets Credibility',

    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.interview': 'Interview Lab',
    'nav.reports': 'Reports',
    'nav.pricing': 'Pricing',
    'nav.settings': 'Settings',
    'nav.logout': 'Sign Out',
    'nav.login': 'Get Started',
    'nav.back': 'Back to Lobby',

    // Landing
    'landing.hero.title': 'Vet Engineers.',
    'landing.hero.title2': 'Not Resumes.',
    'landing.hero.subtitle': 'AI-driven deep technical interviews that expose real engineering ability. Radar-scored reports. Anti-cheat monitoring. Zero bias.',
    'landing.hero.cta': 'Start Free Assessment',
    'landing.hero.cta2': 'Enterprise Demo',
    'landing.stats.interviews': 'Deep Interviews',
    'landing.stats.engineers': 'Engineers Vetted',
    'landing.stats.accuracy': 'Accuracy Rate',
    'landing.feature1.title': 'Adaptive AI Interrogation',
    'landing.feature1.desc': 'Gemini-powered interviewer that adapts questions based on your resume, GitHub repos, and live responses.',
    'landing.feature2.title': 'Monaco Code Sandbox',
    'landing.feature2.desc': 'VS Code-grade editor with syntax highlighting, autocomplete, and multi-language support.',
    'landing.feature3.title': 'Radar Intelligence Report',
    'landing.feature3.desc': 'Multi-dimensional skill radar charts with integrity scoring and AI-generated verdicts.',
    'landing.howit.title': 'How It Works',
    'landing.howit.step1': 'Upload Resume or Connect GitHub',
    'landing.howit.step2': 'AI Deep Technical Interview',
    'landing.howit.step3': 'Receive Intelligence Report',
    'landing.auth.title': 'Authenticate',
    'landing.auth.subtitle': 'Choose your identity provider',

    // Dashboard
    'dash.resume.title': 'Technical Profile & Context Injection',
    'dash.resume.desc': 'Upload your resume or paste your tech stack to activate RAG-powered targeted questioning.',
    'dash.resume.placeholder': 'e.g., "5 years React/Node.js, built distributed systems at scale, Kubernetes, AWS..."',
    'dash.launch': 'Launch Interview Engine',
    'dash.events.title': 'Open Positions',
    'dash.events.create': 'Post Position',
    'dash.reports.title': 'Assessment Archive',
    'dash.reports.empty': 'No assessments yet.',
    'dash.reports.rounds': 'Rounds',

    // Interview
    'interview.title': 'CyberVett Interview Engine',
    'interview.status': 'Gemini Neural Core Online',
    'interview.end': 'End & Generate Report',
    'interview.saving': 'Generating intelligence report...',
    'interview.placeholder': 'Type your response, press Enter to send...',
    'interview.send': 'Send',
    'interview.loading': 'Analyzing response vectors...',
    'interview.greeting': "Welcome to your CyberVett technical assessment. I'm your AI interviewer, calibrated for deep technical evaluation. Let's begin — please introduce yourself and your core technical expertise.",
    'interview.resume.notice': '[CRITICAL CONTEXT] Candidate provided the following profile:',
    'interview.reconnect': 'Network fluctuation detected. Resuming from where we left off regarding',
    'interview.mode.text': 'Text',
    'interview.mode.code': 'Code',
    'interview.timer': 'Duration',
    'interview.round': 'Round',

    // Report
    'report.title': 'Technical Assessment Report',
    'report.overall': 'Overall Score',
    'report.verdict': 'Verdict',
    'report.strengths': 'Key Strengths',
    'report.improvements': 'Areas for Improvement',
    'report.summary': 'Executive Summary',
    'report.integrity': 'Integrity Score',
    'report.integrity.high': 'Highly Trustworthy',
    'report.integrity.medium': 'Some Concerns',
    'report.integrity.low': 'Serious Integrity Issues',
    'report.dimensions': 'Competency Dimensions',
    'report.chat': 'Interview Transcript',
    'report.verdict.STRONG_HIRE': 'STRONG HIRE',
    'report.verdict.HIRE': 'HIRE',
    'report.verdict.MAYBE': 'MAYBE',
    'report.verdict.NO_HIRE': 'NO HIRE',

    // Pricing
    'pricing.title': 'Choose Your Plan',
    'pricing.subtitle': 'From solo engineers to enterprise teams',
    'pricing.free.name': 'Recon',
    'pricing.free.price': 'Free',
    'pricing.free.desc': '3 interviews/month, basic reports',
    'pricing.pro.name': 'Operator',
    'pricing.pro.price': '$9.99/mo',
    'pricing.pro.desc': 'Unlimited interviews, full radar reports, anti-cheat',
    'pricing.enterprise.name': 'Command',
    'pricing.enterprise.price': '$499/mo',
    'pricing.enterprise.desc': 'Custom question banks, team management, API access',
    'pricing.cta.free': 'Start Free',
    'pricing.cta.pro': 'Upgrade Now',
    'pricing.cta.enterprise': 'Contact Sales',

    // Events Dialog
    'events.dialog.title': 'Post a Position',
    'events.field.title': 'Position Title',
    'events.field.org': 'Organization',
    'events.field.desc': 'Job Description',
    'events.submit': 'Publish',
    'events.submitting': 'Publishing...',

    // Anti-cheat
    'anticheat.tab_switch': 'Tab switches detected',
    'anticheat.paste': 'Paste events detected',
    'anticheat.blur': 'Window blur events',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',

    // Dimensions
    'dim.ad': 'Architecture Design',
    'dim.cf': 'Core Fundamentals',
    'dim.sa': 'Security Awareness',
    'dim.cq': 'Code Quality',
    'dim.ps': 'Problem Solving',
    'dim.c': 'Communication',
    'dim.cult': 'Culture Fit',
  },
  cn: {
    'brand.name': 'CyberVett',
    'brand.tagline': '精英工程师 AI 深度技术审核平台',
    'brand.tagline.short': '代码即信用',

    'nav.dashboard': '控制面板',
    'nav.interview': '面试实验室',
    'nav.reports': '评估报告',
    'nav.pricing': '订阅计划',
    'nav.settings': '设置',
    'nav.logout': '退出',
    'nav.login': '开始使用',
    'nav.back': '返回大厅',

    'landing.hero.title': '审核工程师。',
    'landing.hero.title2': '而非简历。',
    'landing.hero.subtitle': 'AI 驱动的深度技术面试，精准暴露真实工程能力。雷达图评分，反作弊监控，零偏差。',
    'landing.hero.cta': '免费开始评估',
    'landing.hero.cta2': '企业演示',
    'landing.stats.interviews': '深度面试',
    'landing.stats.engineers': '工程师已审核',
    'landing.stats.accuracy': '准确率',
    'landing.feature1.title': '自适应 AI 拷问',
    'landing.feature1.desc': 'Gemini 驱动的面试官，根据简历、GitHub 仓库和实时回答自适应调整题目难度。',
    'landing.feature2.title': 'Monaco 代码沙盒',
    'landing.feature2.desc': 'VS Code 级编辑器，语法高亮、智能补全、多语言支持。',
    'landing.feature3.title': '雷达情报报告',
    'landing.feature3.desc': '多维能力雷达图 + 诚信度评分 + AI 生成的审核结论。',
    'landing.howit.title': '如何运作',
    'landing.howit.step1': '上传简历或关联 GitHub',
    'landing.howit.step2': 'AI 深度技术面考',
    'landing.howit.step3': '获取情报评估报告',
    'landing.auth.title': '建立连接',
    'landing.auth.subtitle': '选择认证协议',

    'dash.resume.title': '技术档案与上下文注入',
    'dash.resume.desc': '上传简历或粘贴技术栈，激活 RAG 精准追问引擎。',
    'dash.resume.placeholder': '例如："5年 React/Node.js 经验，构建过分布式系统，熟悉 Kubernetes、AWS..."',
    'dash.launch': '启动面考引擎',
    'dash.events.title': '极客招募令',
    'dash.events.create': '发布需求',
    'dash.reports.title': '审计档案',
    'dash.reports.empty': '空空如也。',
    'dash.reports.rounds': '回合',

    'interview.title': 'CyberVett 面考引擎',
    'interview.status': 'Gemini 神经核心已连接',
    'interview.end': '结束并生成报告',
    'interview.saving': '正在生成情报报告...',
    'interview.placeholder': '输入你的回答，按回车发送...',
    'interview.send': '发送',
    'interview.loading': '正在分析响应向量...',
    'interview.greeting': '欢迎进入 CyberVett 技术评估。我是你的 AI 面试官，已为深度技术评估完成校准。请先做个简短的自我介绍，说说你的核心技术领域。',
    'interview.resume.notice': '【关键上下文】候选人提供了以下技术档案：',
    'interview.reconnect': '检测到网络波动，我们接着刚才关于以下主题的问题继续：',
    'interview.mode.text': '文本',
    'interview.mode.code': '代码',
    'interview.timer': '用时',
    'interview.round': '回合',

    'report.title': '技术评估报告',
    'report.overall': '综合评分',
    'report.verdict': '审核结论',
    'report.strengths': '核心优势',
    'report.improvements': '改进建议',
    'report.summary': '总结摘要',
    'report.integrity': '诚信度评分',
    'report.integrity.high': '高度可信',
    'report.integrity.medium': '存在疑虑',
    'report.integrity.low': '严重诚信问题',
    'report.dimensions': '能力维度',
    'report.chat': '面试记录',
    'report.verdict.STRONG_HIRE': '强烈推荐录用',
    'report.verdict.HIRE': '推荐录用',
    'report.verdict.MAYBE': '待定',
    'report.verdict.NO_HIRE': '不推荐',

    'pricing.title': '选择你的计划',
    'pricing.subtitle': '从个人到企业团队',
    'pricing.free.name': '侦察版',
    'pricing.free.price': '免费',
    'pricing.free.desc': '每月3次面试，基础报告',
    'pricing.pro.name': '特工版',
    'pricing.pro.price': '$9.99/月',
    'pricing.pro.desc': '无限面试，完整雷达图，反作弊报告',
    'pricing.enterprise.name': '指挥部',
    'pricing.enterprise.price': '$499/月',
    'pricing.enterprise.desc': '定制题库，团队管理，API 接口',
    'pricing.cta.free': '免费开始',
    'pricing.cta.pro': '立即升级',
    'pricing.cta.enterprise': '联系销售',

    'events.dialog.title': '发布需求',
    'events.field.title': '活动标题',
    'events.field.org': '发起组织',
    'events.field.desc': '任务详情',
    'events.submit': '发布',
    'events.submitting': '上链中...',

    'anticheat.tab_switch': '检测到标签页切换',
    'anticheat.paste': '检测到粘贴事件',
    'anticheat.blur': '窗口失焦事件',

    'common.loading': '加载中...',
    'common.error': '出了点问题',
    'common.retry': '重试',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.save': '保存',
    'common.delete': '删除',

    // Dimensions
    'dim.ad': '架构设计',
    'dim.cf': '核心基础',
    'dim.sa': '安全意识',
    'dim.cq': '代码质量',
    'dim.ps': '问题解决',
    'dim.c': '沟通能力',
    'dim.cult': '文化匹配',
  }
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState('cn')
  
  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key
  }, [lang])

  const toggleLang = useCallback(() => {
    setLang(prev => prev === 'en' ? 'cn' : 'en')
  }, [])

  return (
    <I18nContext.Provider value={{ t, lang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
