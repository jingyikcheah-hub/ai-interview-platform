import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

/**
 * InterviewToolbar — status bar at the top of the interview room.
 *
 * @param {{
 *   elapsedSeconds: number,
 *   roundCount: number,
 *   integrityScore: number,
 *   isActive: boolean
 * }} props
 */
export default function InterviewToolbar({ elapsedSeconds = 0, roundCount = 0, integrityScore = 100, isActive = true }) {
  const { t } = useI18n()

  // Format MM:SS
  const minutes = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')
  const seconds = String(elapsedSeconds % 60).padStart(2, '0')

  // Anti-cheat status
  let statusColor, statusDotClass, statusLabel
  if (integrityScore >= 90) {
    statusColor = 'text-emerald-400'
    statusDotClass = 'bg-emerald-500'
    statusLabel = 'Clean'
  } else if (integrityScore >= 60) {
    statusColor = 'text-amber-400'
    statusDotClass = 'bg-amber-500'
    statusLabel = 'Warning'
  } else {
    statusColor = 'text-red-400'
    statusDotClass = 'bg-red-500'
    statusLabel = 'Alert'
  }

  return (
    <motion.div
      id="interview-toolbar"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex items-center justify-between px-5 py-2 backdrop-blur-xl bg-card/40 border border-white/5 rounded-lg mx-1 mb-1"
    >
      {/* Left: Timer */}
      <div className="flex items-center gap-2 min-w-[120px]" id="toolbar-timer">
        <i className="fa-solid fa-clock text-primary text-xs" />
        <span className="text-xs text-muted-foreground font-medium">
          {t('interview.timer')}
        </span>
        <span className="font-mono text-sm font-bold text-foreground tabular-nums tracking-wider">
          {minutes}:{seconds}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/10" />

      {/* Center: Round counter */}
      <div className="flex items-center gap-2" id="toolbar-round">
        <i className="fa-solid fa-layer-group text-primary text-xs" />
        <span className="text-xs text-muted-foreground font-medium">
          {t('interview.round')}
        </span>
        <span className="font-mono text-sm font-bold text-foreground">
          {roundCount}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-white/10" />

      {/* Right: Anti-cheat status */}
      <div className="flex items-center gap-2 min-w-[120px] justify-end" id="toolbar-integrity">
        <i className={`fa-solid fa-shield-halved text-xs ${statusColor}`} />
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusDotClass} opacity-75`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusDotClass}`} />
          </span>
          <span className={`text-xs font-medium ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <span className="font-mono text-[10px] text-muted-foreground/60">
          {integrityScore}
        </span>
      </div>
    </motion.div>
  )
}
