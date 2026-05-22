import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useSpring, animate } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

/**
 * Color config keyed by severity tier.
 * oklch converted to hex for inline SVG usage.
 */
const TIERS = {
  high: {
    color: '#34d399', // oklch(0.72 0.18 165) ≈ emerald-400
    glow: 'rgba(52,211,153,0.25)',
    labelKey: 'report.integrity.high',
  },
  medium: {
    color: '#fbbf24', // oklch(0.78 0.15 80) ≈ amber-400
    glow: 'rgba(251,191,36,0.25)',
    labelKey: 'report.integrity.medium',
  },
  low: {
    color: '#f87171', // oklch(0.62 0.24 25) ≈ red-400
    glow: 'rgba(248,113,113,0.25)',
    labelKey: 'report.integrity.low',
  },
}

function getTier(score) {
  if (score >= 90) return TIERS.high
  if (score >= 60) return TIERS.medium
  return TIERS.low
}

/**
 * Integrity score badge with animated SVG progress ring.
 *
 * @param {{
 *   score: number,
 *   details?: { tabSwitches: number, pasteEvents: number, windowBlurs: number, totalAwayMs: number }
 * }} props
 */
function IntegrityBadge({ score = 0, details }) {
  const { t } = useI18n()
  const tier = getTier(score)

  // SVG ring geometry
  const SIZE = 120
  const STROKE = 6
  const RADIUS = (SIZE - STROKE) / 2
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE

  return (
    <motion.div
      id="integrity-badge"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="inline-flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-card/60 px-6 py-5 backdrop-blur-xl"
      style={{
        boxShadow: `0 0 24px ${tier.glow}, 0 0 48px ${tier.glow}`,
      }}
    >
      {/* Ring */}
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
          />
          {/* Progress */}
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={tier.color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>

        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-bold tabular-nums"
            style={{ color: tier.color }}
          >
            {score}
          </span>
        </div>
      </div>

      {/* Label */}
      <span
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: tier.color }}
      >
        {t(tier.labelKey)}
      </span>

      {/* Optional detail breakdown */}
      {details && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-1 grid grid-cols-2 gap-x-5 gap-y-1 text-[11px] text-white/50"
        >
          <span id="integrity-detail-tabs">
            Tab switches: <strong className="text-white/70">{details.tabSwitches}</strong>
          </span>
          <span id="integrity-detail-paste">
            Paste events: <strong className="text-white/70">{details.pasteEvents}</strong>
          </span>
          <span id="integrity-detail-blur">
            Window blurs: <strong className="text-white/70">{details.windowBlurs}</strong>
          </span>
          <span id="integrity-detail-away">
            Time away:{' '}
            <strong className="text-white/70">
              {Math.round((details.totalAwayMs || 0) / 1000)}s
            </strong>
          </span>
        </motion.div>
      )}
    </motion.div>
  )
}

export default IntegrityBadge
