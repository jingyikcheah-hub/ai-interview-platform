import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import RadarChart from './RadarChart'
import IntegrityBadge from './IntegrityBadge'
import ChatMessage from '../interview/ChatMessage'
import PredictionCard from './PredictionCard'

const DIMENSION_I18N = {
  'Architecture Design': { en: 'Architecture Design', cn: '架构设计' },
  'Core Fundamentals': { en: 'Core Fundamentals', cn: '核心基础' },
  'Security Awareness': { en: 'Security Awareness', cn: '安全意识' },
  'Code Quality': { en: 'Code Quality', cn: '代码质量' },
  'Problem Solving': { en: 'Problem Solving', cn: '问题解决' },
  'Communication': { en: 'Communication', cn: '沟通表达' },
  'Culture Fit': { en: 'Culture Fit', cn: '文化匹配' },
}

/* ------------------------------------------------------------------ */
/*  Verdict styling map                                                */
/* ------------------------------------------------------------------ */
const VERDICT_STYLES = {
  STRONG_HIRE: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  HIRE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MAYBE: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  NO_HIRE: 'bg-red-500/20 text-red-400 border-red-500/30',
}

/* ------------------------------------------------------------------ */
/*  Stagger-children animation variants                                */
/* ------------------------------------------------------------------ */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

/* ------------------------------------------------------------------ */
/*  Overall-score ring (large)                                         */
/* ------------------------------------------------------------------ */
function ScoreRing({ score }) {
  const SIZE = 160
  const STROKE = 8
  const RADIUS = (SIZE - STROKE) / 2
  const CIRC = 2 * Math.PI * RADIUS
  const offset = CIRC - (score / 100) * CIRC

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#3888ff"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRC}
          initial={{ strokeDashoffset: CIRC }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.2 }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold tabular-nums text-white">
          {score}
        </span>
        <span className="text-[11px] uppercase tracking-widest text-white/40">
          / 100
        </span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ReportCard                                                         */
/* ------------------------------------------------------------------ */
function ReportCard({ report }) {
  const { t, lang } = useI18n()
  const [showTranscript, setShowTranscript] = useState(false)

  if (!report) return null

  const {
    id,
    candidate_email,
    chat_history = [],
    created_at,
    evaluation = {},
    integrity = {},
  } = report

  const {
    overallScore = 0,
    dimensions = [],
    summary = '',
    strengths = [],
    improvements = [],
    verdict = 'MAYBE',
    feedbackLetter = '',
  } = evaluation

  const {
    integrityScore = 0,
    tabSwitches = 0,
    pasteEvents = 0,
    windowBlurs = 0,
    totalAwayMs = 0,
  } = integrity

  const verdictClass = VERDICT_STYLES[verdict] || VERDICT_STYLES.MAYBE

  return (
    <motion.div
      id={`report-card-${id}`}
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto flex w-full max-w-3xl flex-col gap-6"
    >
      {/* ====== 1. Header ====== */}
      <motion.div variants={item}>
        <Card className="border-white/5 bg-card/60 backdrop-blur-xl">
          <CardHeader className="border-b border-white/5">
            <CardTitle className="text-lg text-white/90">
              {t('report.title')}
            </CardTitle>
          </CardHeader>

          <CardContent className="flex flex-wrap items-center gap-8 pt-4">
            {/* Big score ring */}
            <ScoreRing score={overallScore} />

            <div className="flex flex-col gap-3">
              {/* Verdict badge */}
              <span
                id="report-verdict-badge"
                className={`inline-block rounded-md border px-3 py-1 text-xs font-bold uppercase tracking-wider ${verdictClass}`}
              >
                {t(`report.verdict.${verdict}`)}
              </span>

              {/* Meta */}
              {candidate_email && (
                <span className="text-xs text-white/40">{candidate_email}</span>
              )}
              {created_at && (
                <span className="text-xs text-white/30">
                  {new Date(created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ====== 2. Radar Chart & Explanations ====== */}
      {dimensions.length > 0 && (
        <motion.div variants={item} className="flex flex-col gap-4">
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm text-white/70">
                {t('report.dimensions')}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-2">
              <RadarChart dimensions={dimensions} />
            </CardContent>
          </Card>

          {/* Render Explanations */}
          <div className="grid gap-3 sm:grid-cols-2">
            {dimensions.map((dim, i) => (
              <div key={i} className="flex flex-col gap-1.5 rounded-xl border border-white/5 bg-card/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white/90">{DIMENSION_I18N[dim.name]?.[lang || 'en'] || dim.name}</span>
                  <span className="font-mono text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">{dim.score}/100</span>
                </div>
                {dim.rationale && (
                  <p className="text-xs text-muted-foreground leading-relaxed mt-1">{dim.rationale}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ====== 3. Executive Summary ====== */}
      {summary && (
        <motion.div variants={item}>
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm text-white/70">
                {t('report.summary')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                id="report-summary-text"
                className="whitespace-pre-line text-sm leading-relaxed text-white/80"
              >
                {summary}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ====== 3.5 AI Prediction ====== */}
      <motion.div variants={item}>
        <PredictionCard evaluation={evaluation} />
      </motion.div>

      {/* ====== 4. Strengths ====== */}
      {strengths.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-emerald-500/20 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm text-emerald-400">
                {t('report.strengths')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li
                    key={i}
                    id={`report-strength-${i}`}
                    className="flex items-start gap-2 text-sm text-white/80"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ====== 5. Improvements ====== */}
      {improvements.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-amber-500/20 bg-card/60 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-sm text-amber-400">
                {t('report.improvements')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {improvements.map((imp, i) => (
                  <li
                    key={i}
                    id={`report-improvement-${i}`}
                    className="flex items-start gap-2 text-sm text-white/80"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    {imp}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ====== 6. Integrity Score ====== */}
      <motion.div variants={item}>
        <Card className="border-white/5 bg-card/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-sm text-white/70">
              {t('report.integrity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-2">
            <IntegrityBadge
              score={integrityScore}
              details={{ tabSwitches, pasteEvents, windowBlurs, totalAwayMs }}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ====== 6.5 Personalized Feedback Letter ====== */}
      {feedbackLetter && (
        <motion.div variants={item}>
          <Card className="border-primary/20 bg-primary/5 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <i className="fa-regular fa-envelope" />
                {lang === 'cn' ? 'CTO 的来信' : 'Message from the CTO'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-background/40 p-4 rounded-lg border border-white/5 shadow-inner font-serif text-sm italic text-white/80 leading-relaxed whitespace-pre-line">
                "{feedbackLetter}"
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ====== 7. Transcript Toggle ====== */}
      {chat_history.length > 0 && (
        <motion.div variants={item}>
          <Card className="border-white/5 bg-card/60 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm text-white/70">
                {t('report.chat')}
              </CardTitle>
              <Button
                id="report-toggle-transcript"
                variant="ghost"
                size="sm"
                onClick={() => setShowTranscript((prev) => !prev)}
              >
                {showTranscript ? (lang === 'cn' ? '▲ 收起' : '▲ Collapse') : (lang === 'cn' ? '▼ 展开' : '▼ Expand')}
              </Button>
            </CardHeader>

            {showTranscript && (
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-col gap-3"
                >
                  {chat_history.map((msg, i) => (
                    <ChatMessage key={i} message={msg} isUser={msg.role === 'user'} />
                  ))}
                </motion.div>
              </CardContent>
            )}
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}

export default ReportCard
