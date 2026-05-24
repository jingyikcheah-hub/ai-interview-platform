import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'
import CyberLoadingScreen from '@/components/effects/CyberLoadingScreen'

const VERDICT_COLORS = {
  'STRONG_HIRE': '#10b981', // emerald-500
  'HIRE': '#3b82f6', // blue-500
  'MAYBE': '#f59e0b', // amber-500
  'NO_HIRE': '#ef4444' // red-500
}

export default function PipelinePage() {
  const { t, lang } = useI18n()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [insights, setInsights] = useState(null)
  const [generatingInsights, setGeneratingInsights] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('interview_reports')
        .select('*')
        .order('created_at', { ascending: true })

      if (!error && data) {
        const validReports = data.filter(r => {
          const letter = r.evaluation?.feedbackLetter || ''
          return !letter.toLowerCase().includes('system error')
        })
        setReports(validReports)
      }
      setLoading(false)
    }
    
    fetchData()

    // Real-time subscription
    const channel = supabase.channel('realtime:interview_reports')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'interview_reports' },
        (payload) => {
          const letter = payload.new.evaluation?.feedbackLetter || ''
          if (!letter.toLowerCase().includes('system error')) {
            setReports(current => [...current, payload.new])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleGenerateInsights = async () => {
    if (reports.length === 0) return
    setGeneratingInsights(true)
    
    // Calculate basic aggregates to send to Gemini
    const total = reports.length
    const avgScore = reports.reduce((acc, r) => acc + (r.evaluation?.overallScore || 0), 0) / total
    
    const verdicts = reports.reduce((acc, r) => {
      const v = r.evaluation?.verdict
      if (v) acc[v] = (acc[v] || 0) + 1
      return acc
    }, {})

    let dimSums = {}
    reports.forEach(r => {
      r.evaluation?.dimensions?.forEach(d => {
        dimSums[d.name] = (dimSums[d.name] || 0) + d.score
      })
    })
    const avgDims = Object.entries(dimSums).map(([name, sum]) => ({
      name,
      score: Math.round(sum / total)
    }))

    const prompt = `You are an elite Talent Intelligence Analyst.
Analyze the following aggregated technical interview data for ${total} candidates and provide 3 highly insightful, strategic takeaways for the hiring manager. Focus on anomalies, pipeline quality, and hiring strategy recommendations.

[AGGREGATED DATA]:
- Total Candidates: ${total}
- Average Overall Score: ${Math.round(avgScore)}/100
- Verdict Distribution: ${JSON.stringify(verdicts)}
- Average Dimension Scores: ${JSON.stringify(avgDims)}

RESPOND ONLY WITH VALID JSON using this exact schema (translate text values to ${lang === 'en' ? 'English' : 'Simplified Chinese'}):
{
  "summary": "...",
  "insights": [
    { "title": "...", "description": "...", "actionableAdvice": "..." },
    { "title": "...", "description": "...", "actionableAdvice": "..." },
    { "title": "...", "description": "...", "actionableAdvice": "..." }
  ]
}`

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      })

      const textResponse = await response.text()
      if (!textResponse) {
        throw new Error(`Empty response from server (Status: ${response.status})`)
      }

      let data;
      try {
        data = JSON.parse(textResponse)
      } catch (err) {
        console.error("Failed to parse JSON. Raw response:", textResponse)
        throw new Error(`Failed to parse server response. Status: ${response.status}`)
      }

      if (!response.ok) throw new Error(data.error || 'API Error')

      const text = data.text.trim()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid JSON format returned')
      
      setInsights(JSON.parse(jsonMatch[0]))
    } catch (error) {
      console.error(error)
      alert(t('common.error'))
    } finally {
      setGeneratingInsights(false)
    }
  }

  if (loading) {
    return <div className="h-screen pt-16 flex items-center justify-center"><CyberLoadingScreen /></div>
  }

  // --- Prepare Chart Data ---
  
  // 1. Trend Data (Scores over time)
  const trendData = reports.map((r, i) => ({
    name: new Date(r.created_at).toLocaleDateString(),
    score: r.evaluation?.overallScore || 0,
    index: i
  }))

  // 2. Radar Data (Average Dimensions)
  const getDimensionLabel = (name) => {
    const map = {
      'Architecture Design': t('dim.ad') || 'Architecture Design',
      'Core Fundamentals': t('dim.cf') || 'Core Fundamentals',
      'Security Awareness': t('dim.sa') || 'Security Awareness',
      'Code Quality': t('dim.cq') || 'Code Quality',
      'Problem Solving': t('dim.ps') || 'Problem Solving',
      'Communication': t('dim.c') || 'Communication',
      'Culture Fit': t('dim.cult') || 'Culture Fit',
    }
    return map[name] || name
  }

  let dimSums = {}
  reports.forEach(r => {
    r.evaluation?.dimensions?.forEach(d => {
      dimSums[d.name] = (dimSums[d.name] || 0) + d.score
    })
  })
  const radarData = Object.entries(dimSums).map(([name, sum]) => ({
    subject: getDimensionLabel(name),
    A: Math.round(sum / reports.length),
    fullMark: 100
  }))

  // 3. Verdict Distribution
  const verdicts = reports.reduce((acc, r) => {
    const v = r.evaluation?.verdict
    if (v) acc[v] = (acc[v] || 0) + 1
    return acc
  }, {})
  const barData = Object.entries(verdicts).map(([name, count]) => ({
    displayName: t(`report.verdict.${name}`) || name,
    originalName: name,
    count
  }))

  return (
    <div className="min-h-screen pb-12 px-4 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground flex items-center gap-3">
            <i className="fa-solid fa-chart-network text-primary" />
            {t('pipeline.title') || 'Talent Pipeline Intelligence'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('pipeline.subtitle') || 'Aggregated insights from all candidate evaluations.'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-mono text-muted-foreground">{t('pipeline.total') || 'TOTAL CANDIDATES'}</p>
            <p className="text-3xl font-black text-primary">{reports.length}</p>
          </div>
          <Button
            onClick={handleGenerateInsights}
            disabled={generatingInsights || reports.length === 0}
            className="bg-primary hover:bg-primary/90 h-12 px-6 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            {generatingInsights ? (
              <><i className="fa-solid fa-circle-notch fa-spin mr-2" /> {t('pipeline.btn.generating') || 'Analyzing...'}</>
            ) : (
              <><i className="fa-solid fa-brain-circuit mr-2" /> {t('pipeline.btn.generate') || 'AI Insights'}</>
            )}
          </Button>
        </div>
      </motion.div>

      {/* AI Insights Panel */}
      <AnimatePresence>
        {insights && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent border border-primary/20 rounded-xl p-6 mb-8 relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary rounded-l-xl shadow-[0_0_15px_#3b82f6]" />
              <h2 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                <i className="fa-solid fa-sparkles" /> {t('pipeline.ai.title') || 'Executive AI Summary'}
              </h2>
              <p className="text-foreground/90 leading-relaxed mb-6">
                {insights.summary}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {insights.insights.map((insight, idx) => (
                  <div key={idx} className="bg-background/40 border border-white/5 p-4 rounded-lg">
                    <h3 className="font-bold text-foreground mb-2">{insight.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{insight.description}</p>
                    <div className="text-sm border-t border-white/10 pt-3 flex items-start gap-2">
                      <i className="fa-solid fa-arrow-turn-down-right text-primary mt-1" />
                      <span className="text-primary/90">{insight.actionableAdvice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-trend-up text-muted-foreground" /> {t('pipeline.chart.trend') || 'Pipeline Quality Trend'}
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Verdict Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6 rounded-xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <i className="fa-solid fa-chart-pie text-muted-foreground" /> {t('pipeline.chart.verdict') || 'Verdict Distribution'}
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="displayName" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={VERDICT_COLORS[entry.originalName] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Average Radar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="lg:col-span-3 glass-panel p-6 rounded-xl flex flex-col md:flex-row items-center gap-8">
          <div className="md:w-1/3">
            <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
              <i className="fa-solid fa-radar text-primary" /> {t('pipeline.chart.radar') || 'Average Competency Radar'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {lang === 'en' ? `Averaged across all ${reports.length} candidates. This highlights the macro-level strengths and weaknesses of your current talent pipeline.` : `基于全部 ${reports.length} 名候选人的数据聚合。宏观展示当前人才管道的优势与薄弱环节。`}
            </p>
          </div>
          <div className="md:w-2/3 h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.3)" />
                <Radar name="Average Score" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
