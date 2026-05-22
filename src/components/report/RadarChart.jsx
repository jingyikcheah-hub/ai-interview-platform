import { motion } from 'framer-motion'
import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts'

/**
 * Multi-dimensional skill radar chart — futuristic HUD display.
 *
 * @param {{ dimensions: { name: string, score: number }[], size?: number }} props
 */
function RadarChart({ dimensions = [], size = 350 }) {
  // Recharts expects a `value` key by default; map score → value
  const data = dimensions.map((d) => ({
    subject: d.name,
    value: d.score,
    fullMark: 100,
  }))

  return (
    <motion.div
      id="radar-chart-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative flex items-center justify-center"
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
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
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
              fontSize: 12,
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
  )
}

export default RadarChart
