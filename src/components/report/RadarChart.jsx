import { motion } from 'framer-motion'
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'
import { useI18n } from '@/lib/i18n'

const ABBREV_MAP = {
  'Architecture Design': 'AD',
  'Core Fundamentals': 'CF',
  'Security Awareness': 'SA',
  'Code Quality': 'CQ',
  'Problem Solving': 'PS',
  'Communication': 'C',
  'Culture Fit': 'CUL'
}

const DIM_TRANSLATION_KEYS = {
  'Architecture Design': 'dim.ad',
  'Core Fundamentals': 'dim.cf',
  'Security Awareness': 'dim.sa',
  'Code Quality': 'dim.cq',
  'Problem Solving': 'dim.ps',
  'Communication': 'dim.c',
  'Culture Fit': 'dim.cult'
}

/**
 * Multi-dimensional skill radar chart — futuristic HUD display.
 *
 * @param {{ dimensions: { name: string, score: number }[], size?: number }} props
 */
function RadarChart({ dimensions = [], size = 350 }) {
  const { t } = useI18n()

  // Recharts expects a `value` key by default; map score → value
  const data = dimensions.map((d) => {
    const tKey = DIM_TRANSLATION_KEYS[d.name]
    return {
      subject: ABBREV_MAP[d.name] || d.name.substring(0, 3).toUpperCase(),
      fullName: tKey ? t(tKey) : d.name,
      value: d.score,
      fullMark: 100,
    }
  })

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-3xl mx-auto">
      {/* Chart */}
      <motion.div
        id="radar-chart-container"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        {/* Neon glow backdrop */}
        <div
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            boxShadow:
              '0 0 40px rgba(56,136,255,0.15), 0 0 80px rgba(56,136,255,0.08)',
          }}
        />

        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="65%" data={data}>
            {/* Grid lines — subtle white at 10 % opacity */}
            <PolarGrid
              stroke="rgba(255,255,255,0.10)"
              strokeDasharray="3 3"
            />

            {/* Angle axis — white labels */}
            <PolarAngleAxis
              dataKey="subject"
              tick={{
                fill: '#ffffff',
                fontSize: 14,
                fontWeight: 'bold',
                fontFamily: 'Geist Variable, sans-serif',
              }}
            />

            {/* Radius axis — very subtle / hidden */}
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={false}
              axisLine={false}
            />

            {/* Radar area */}
            <Radar
              name="Score"
              dataKey="value"
              /* oklch(0.65 0.25 265) ≈ #3888ff — primary blue */
              stroke="#3888ff"
              fill="#3888ff"
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Legend */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col gap-3 bg-card/40 border border-white/5 rounded-xl p-5 min-w-[220px]"
      >
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
          <i className="fa-solid fa-list-ul mr-2" />
          {t('report.dimensions')}
        </h4>
        {data.map((d) => (
          <div key={d.subject} className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold text-primary w-6 text-right shrink-0">{d.subject}</span>
            <span className="text-foreground/90 whitespace-nowrap">{d.fullName}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

export default RadarChart
