import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useI18n } from '@/lib/i18n'
import { useInterview } from '@/contexts/InterviewContext'
import CyberLoadingScreen from '@/components/effects/CyberLoadingScreen'

export default function JDGeneratorPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { startInterview } = useInterview()
  
  const [jdText, setJdText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const handleGenerate = async () => {
    if (!jdText.trim()) return
    
    setIsGenerating(true)
    setError(null)
    setResult(null)

    const prompt = `You are an expert technical recruiter and senior engineering manager. 
Analyze the following Job Description (JD) and automatically generate a structured technical interview plan.

[JOB DESCRIPTION]:
${jdText}

[YOUR TASK]:
1. Extract the primary Job Title.
2. Extract 5-8 core skill tags required for this role.
3. Generate exactly 8 highly specific technical interview questions tailored to these skills. Include a mix of technical deep-dives and architectural/system-design scenarios.
4. Define the evaluation weights (must sum to 100) across these 7 standard dimensions: Architecture Design, Core Fundamentals, Security Awareness, Code Quality, Problem Solving, Communication, Culture Fit.

RESPOND ONLY WITH VALID JSON using this exact schema (translate text values to ${lang === 'en' ? 'English' : 'Simplified Chinese'}):
{
  "jobTitle": "...",
  "skills": ["...", "..."],
  "questions": [
    { "type": "Technical", "question": "..." },
    { "type": "Scenario", "question": "..." }
  ],
  "weights": {
    "Architecture Design": 20,
    "Core Fundamentals": 20,
    "Security Awareness": 10,
    "Code Quality": 15,
    "Problem Solving": 20,
    "Communication": 10,
    "Culture Fit": 5
  }
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

      // Extract JSON from response (in case Gemini wraps it in markdown)
      const text = data.text.trim()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Invalid JSON format returned')
      
      const parsedResult = JSON.parse(jsonMatch[0])
      setResult(parsedResult)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to generate interview plan.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLaunch = () => {
    if (!result) return
    const customConfig = {
      jobTitle: result.jobTitle,
      questions: result.questions,
      weights: result.weights
    }
    const sessionId = startInterview('', lang, customConfig)
    navigate(`/interview/${sessionId}`)
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 max-w-6xl mx-auto flex flex-col gap-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/20 text-primary mb-4 border border-primary/30 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
          <i className="fa-solid fa-wand-magic-sparkles text-3xl" />
        </div>
        <h1 className="text-4xl font-black text-foreground tracking-tight">
          {t('jd.title') || 'JD Auto-Generator'}
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('jd.subtitle') || 'Paste a Job Description. AI will instantly generate a tailored interview plan and specific questions.'}
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Column: Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="backdrop-blur-xl bg-card/60 border border-white/10 rounded-2xl p-6 shadow-2xl relative"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500 rounded-t-2xl opacity-50" />
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
            <i className="fa-solid fa-file-lines text-primary mr-2" />
            {t('jd.input.title') || 'Job Description'}
          </h2>
          <Textarea
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder={t('jd.input.placeholder') || "Paste the full Job Description here...\n\ne.g., 'Looking for a Senior React Native Developer with 5+ years experience... Need strong skills in state management, offline-first architectures, and CI/CD pipelines...'"}
            className="min-h-[400px] bg-background/50 border-white/10 resize-none font-mono text-sm mb-6 placeholder:text-muted-foreground/40"
          />
          <Button
            onClick={handleGenerate}
            disabled={!jdText.trim() || isGenerating}
            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
          >
            {isGenerating ? (
              <><i className="fa-solid fa-circle-notch fa-spin mr-2" />{t('jd.btn.generating') || 'Analyzing JD...'}</>
            ) : (
              <><i className="fa-solid fa-microchip mr-2" />{t('jd.btn.generate') || 'Generate Interview Plan'}</>
            )}
          </Button>

          {error && (
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
              <i className="fa-solid fa-triangle-exclamation mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </motion.div>

        {/* Right Column: Result */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="backdrop-blur-xl bg-card/60 border border-white/10 rounded-2xl p-6 shadow-2xl relative min-h-[520px] flex flex-col"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl opacity-50" />
          
          <AnimatePresence mode="wait">
            {!result && !isGenerating && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center opacity-50"
              >
                <i className="fa-solid fa-robot text-5xl mb-4 text-muted-foreground" />
                <p className="text-muted-foreground font-mono text-sm max-w-[250px]">
                  {t('jd.empty') || 'Awaiting Job Description input to synthesize interview plan.'}
                </p>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center"
              >
                <CyberLoadingScreen message={t('jd.loading') || 'Synthesizing evaluation criteria...'} />
              </motion.div>
            )}

            {result && !isGenerating && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex-1 flex flex-col h-full"
              >
                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin space-y-6">
                  {/* Header */}
                  <div>
                    <h3 className="text-sm font-mono text-emerald-400 mb-1">TARGET ROLE</h3>
                    <h2 className="text-2xl font-bold text-foreground">{result.jobTitle}</h2>
                  </div>

                  {/* Skills */}
                  <div>
                    <h3 className="text-sm font-mono text-emerald-400 mb-3">REQUIRED SKILLS</h3>
                    <div className="flex flex-wrap gap-2">
                      {result.skills.map((skill, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Questions */}
                  <div>
                    <h3 className="text-sm font-mono text-emerald-400 mb-3">TAILORED QUESTIONS ({result.questions.length})</h3>
                    <div className="space-y-3">
                      {result.questions.map((q, i) => (
                        <div key={i} className="bg-background/40 border border-white/5 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/20 text-primary">
                              {q.type}
                            </span>
                            <span className="text-xs font-mono text-muted-foreground">Q{i + 1}</span>
                          </div>
                          <p className="text-sm text-foreground/90">{q.question}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weights */}
                  <div>
                    <h3 className="text-sm font-mono text-emerald-400 mb-3">EVALUATION WEIGHTS</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(result.weights).map(([dim, weight]) => (
                        <div key={dim} className="flex items-center justify-between bg-background/40 border border-white/5 rounded p-2">
                          <span className="text-xs text-muted-foreground truncate mr-2" title={dim}>{dim}</span>
                          <span className="text-xs font-bold text-emerald-400">{weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Launch Action */}
                <div className="pt-6 mt-4 border-t border-white/10 shrink-0">
                  <Button
                    onClick={handleLaunch}
                    className="w-full h-14 text-lg font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                  >
                    <i className="fa-solid fa-rocket mr-2" />
                    {t('jd.btn.launch') || 'Launch Tailored Interview'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
