/** Anti-cheat monitoring system for CyberVett interviews */

export class AntiCheatMonitor {
  constructor(onEvent) {
    this.onEvent = onEvent
    this.listeners = []
    this.tabSwitchCount = 0
    this.pasteCount = 0
    this.blurCount = 0
    this.totalBlurDuration = 0
    this.blurStart = null
  }

  start() {
    // Tab visibility change
    const handleVisibility = () => {
      if (document.hidden) {
        this.tabSwitchCount++
        this.blurStart = Date.now()
        this.onEvent({
          type: 'TAB_SWITCH',
          timestamp: Date.now(),
          count: this.tabSwitchCount,
        })
      } else if (this.blurStart) {
        const duration = Date.now() - this.blurStart
        this.totalBlurDuration += duration
        this.blurStart = null
        this.onEvent({
          type: 'TAB_RETURN',
          timestamp: Date.now(),
          awayDuration: duration,
        })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    this.listeners.push(['visibilitychange', handleVisibility, document])

    // Paste detection
    const handlePaste = (e) => {
      this.pasteCount++
      const text = e.clipboardData?.getData('text') || ''
      this.onEvent({
        type: 'PASTE',
        timestamp: Date.now(),
        contentLength: text.length,
        count: this.pasteCount,
      })
    }
    document.addEventListener('paste', handlePaste)
    this.listeners.push(['paste', handlePaste, document])

    // Window blur (switching apps)
    const handleBlur = () => {
      this.blurCount++
      this.blurStart = Date.now()
      this.onEvent({
        type: 'WINDOW_BLUR',
        timestamp: Date.now(),
        count: this.blurCount,
      })
    }
    window.addEventListener('blur', handleBlur)
    this.listeners.push(['blur', handleBlur, window])

    // Window focus return
    const handleFocus = () => {
      if (this.blurStart) {
        const duration = Date.now() - this.blurStart
        this.totalBlurDuration += duration
        this.blurStart = null
        this.onEvent({
          type: 'WINDOW_FOCUS',
          timestamp: Date.now(),
          awayDuration: duration,
        })
      }
    }
    window.addEventListener('focus', handleFocus)
    this.listeners.push(['focus', handleFocus, window])

    // Copy detection (copying questions to search)
    const handleCopy = () => {
      this.onEvent({
        type: 'COPY',
        timestamp: Date.now(),
      })
    }
    document.addEventListener('copy', handleCopy)
    this.listeners.push(['copy', handleCopy, document])

    // Right-click context menu (often used to inspect/copy)
    const handleContextMenu = (e) => {
      this.onEvent({
        type: 'CONTEXT_MENU',
        timestamp: Date.now(),
      })
    }
    document.addEventListener('contextmenu', handleContextMenu)
    this.listeners.push(['contextmenu', handleContextMenu, document])
  }

  stop() {
    this.listeners.forEach(([event, handler, target]) => {
      target.removeEventListener(event, handler)
    })
    this.listeners = []
  }

  /** Calculate integrity score (0-100) */
  getIntegrityScore() {
    let score = 100

    // Tab switches: -5 per switch, max -30
    score -= Math.min(this.tabSwitchCount * 5, 30)

    // Paste events: -8 per paste, max -25
    score -= Math.min(this.pasteCount * 8, 25)

    // Window blur: -3 per blur, max -20
    score -= Math.min(this.blurCount * 3, 20)

    // Total time away: -1 per 10 seconds, max -25
    const awaySeconds = this.totalBlurDuration / 1000
    score -= Math.min(Math.floor(awaySeconds / 10), 25)

    return Math.max(0, score)
  }

  getSummary() {
    return {
      tabSwitches: this.tabSwitchCount,
      pasteEvents: this.pasteCount,
      windowBlurs: this.blurCount,
      totalAwayMs: this.totalBlurDuration,
      integrityScore: this.getIntegrityScore(),
    }
  }
}
