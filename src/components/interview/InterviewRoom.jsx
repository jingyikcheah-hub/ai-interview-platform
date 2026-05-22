import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useInterview } from '@/contexts/InterviewContext'
import { useI18n } from '@/lib/i18n'
import { buildInterviewPrompt } from '@/lib/aiEvaluator'
import { AntiCheatMonitor } from '@/lib/antiCheat'
import ChatMessage from './ChatMessage'
import CodeEditor from './CodeEditor'
import CyberLoadingScreen from '../effects/CyberLoadingScreen'
import InterviewToolbar from './InterviewToolbar'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

/**
 * InterviewRoom — The core CyberVett interview experience.
 *
 * @param {{
 *   onExit: () => void,
 *   userEmail: string,
 *   resumeContext: string,
 *   onGenerateReport: (messages: Array, antiCheatSummary: object) => Promise<void>
 * }} props
 */
export default function InterviewRoom({ onExit, userEmail, resumeContext = '', onGenerateReport }) {
  const { t } = useI18n()
  const {
    messages,
    isActive,
    elapsedSeconds,
    roundCount,
    startInterview,
    resumeInterview,
    addMessage,
    setMessages,
    logAntiCheatEvent,
    endInterview,
    sessionId,
    config,
  } = useInterview()

  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [inputMode, setInputMode] = useState('text') // 'text' | 'code'
  const [integrityScore, setIntegrityScore] = useState(100)
  const [showResumePrompt, setShowResumePrompt] = useState(false)

  const messagesEndRef = useRef(null)
  const antiCheatRef = useRef(null)
  const chatContainerRef = useRef(null)
  const inputRef = useRef(null)

  // --- Auto-scroll to bottom ---
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading, scrollToBottom])

  // --- Session initialization ---
  useEffect(() => {
    // If we have a session with messages, offer to resume
    if (sessionId && isActive && messages.length > 0) {
      setShowResumePrompt(true)
      return
    }

    // Session was just started by DashboardPage but has no messages yet — add greeting
    if (sessionId && isActive && messages.length === 0) {
      const rc = resumeContext || config?.resumeContext || ''
      const greeting = rc
        ? `${t('interview.greeting')}\n\n> ${t('interview.resume.notice')} *"${rc}"*`
        : t('interview.greeting')
      addMessage('ai', greeting)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Anti-cheat monitor lifecycle ---
  useEffect(() => {
    const monitor = new AntiCheatMonitor((event) => {
      logAntiCheatEvent(event.type, event)
    })
    monitor.start()
    antiCheatRef.current = monitor

    // Update integrity score periodically
    const scoreInterval = setInterval(() => {
      if (antiCheatRef.current) {
        setIntegrityScore(antiCheatRef.current.getIntegrityScore())
      }
    }, 2000)

    return () => {
      monitor.stop()
      clearInterval(scoreInterval)
    }
  }, [logAntiCheatEvent])

  // --- Handle resuming existing session ---
  const handleResumeSession = useCallback(() => {
    setShowResumePrompt(false)
  }, [])

  const handleNewSession = useCallback(() => {
    setShowResumePrompt(false)
    startInterview(resumeContext, 'en')
    const greeting = resumeContext
      ? `${t('interview.greeting')}\n\n> ${t('interview.resume.notice')} *"${resumeContext}"*`
      : t('interview.greeting')
    addMessage('ai', greeting)
  }, [startInterview, resumeContext, t, addMessage])

  // --- Send message to Gemini ---
  const handleSend = useCallback(async (overrideText) => {
    const textToSend = overrideText || inputText.trim()
    if (!textToSend || isLoading) return

    // Add user message
    addMessage('user', textToSend)
    setInputText('')
    setIsLoading(true)

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      // Build prompt with FULL conversation history
      const currentMessages = [...messages, { role: 'user', text: textToSend, timestamp: Date.now() }]
      const prompt = buildInterviewPrompt(textToSend, resumeContext || config?.resumeContext || '', currentMessages)

      const result = await model.generateContent(prompt)
      const aiText = result.response.text()
      addMessage('ai', aiText)
    } catch (error) {
      console.error('AI response error:', error)
      const errorMsg = error.message?.includes('API key')
        ? 'API key configuration error. Please check VITE_GEMINI_API_KEY.'
        : `${t('interview.reconnect')} — ${t('common.retry')}`
      addMessage('ai', errorMsg)
    } finally {
      setIsLoading(false)
      // Refocus input
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [inputText, isLoading, messages, resumeContext, config, addMessage, t])

  // --- Handle code submission ---
  const handleCodeSubmit = useCallback((code, language) => {
    const formattedMessage = `Here is my code solution in **${language}**:\n\n\`\`\`${language}\n${code}\n\`\`\``
    handleSend(formattedMessage)
    setInputMode('text') // Switch back to text after code submit
  }, [handleSend])

  // --- End interview flow ---
  const handleEndInterview = useCallback(async () => {
    if (messages.filter((m) => m.role === 'user').length < 1) {
      // No real conversation happened, just exit
      endInterview()
      onExit()
      return
    }

    setIsSaving(true)

    try {
      const antiCheatSummary = antiCheatRef.current
        ? antiCheatRef.current.getSummary()
        : { integrityScore: 100, tabSwitches: 0, pasteEvents: 0, windowBlurs: 0, totalAwayMs: 0 }

      // Call parent handler to generate report & save
      if (onGenerateReport) {
        await onGenerateReport(messages, antiCheatSummary)
      }
    } catch (error) {
      console.error('Report generation failed:', error)
      // Don't block exit on report failure
    } finally {
      setIsSaving(false)
      endInterview()
      onExit()
    }
  }, [messages, endInterview, onExit, onGenerateReport])

  // --- Keyboard shortcut: Enter to send ---
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // --- Session resume prompt overlay ---
  if (showResumePrompt) {
    return (
      <div className="w-full h-[calc(100vh-8rem)] max-w-6xl mx-auto flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="backdrop-blur-xl bg-card/80 border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-primary/10"
        >
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
              <i className="fa-solid fa-rotate-right text-primary text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Session Detected</h2>
            <p className="text-sm text-muted-foreground">
              An active interview session was found with {messages.length} messages. Would you like to resume?
            </p>
            <div className="flex gap-3 pt-2">
              <Button
                id="resume-session-btn"
                onClick={handleResumeSession}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <i className="fa-solid fa-play mr-2" />
                Resume
              </Button>
              <Button
                id="new-session-btn"
                variant="outline"
                onClick={handleNewSession}
                className="flex-1 border-border"
              >
                <i className="fa-solid fa-plus mr-2" />
                New Session
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full h-[calc(100vh-8rem)] max-w-6xl mx-auto flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full h-full"
      >
        <Card className="w-full h-full flex flex-col shadow-2xl shadow-primary/5 border border-white/5 overflow-hidden backdrop-blur-xl bg-card/80 rounded-2xl">
          {/* ═══ Header ═══ */}
          <CardHeader className="border-b border-white/5 px-6 py-4 flex flex-row justify-between items-center shrink-0 bg-background/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary shadow-inner border border-primary/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                <i className="fa-solid fa-microchip text-xl" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {t('interview.title')}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="font-mono text-xs">{t('interview.status')}</span>
                </CardDescription>
              </div>
            </div>
            <Button
              id="end-interview-btn"
              variant="destructive"
              onClick={handleEndInterview}
              disabled={isSaving}
              className="shadow-lg"
            >
              <i className="fa-solid fa-flag-checkered mr-2" />
              {isSaving ? t('interview.saving') : t('interview.end')}
            </Button>
          </CardHeader>

          {/* ═══ Toolbar ═══ */}
          <InterviewToolbar
            elapsedSeconds={elapsedSeconds}
            roundCount={roundCount}
            integrityScore={integrityScore}
            isActive={isActive}
          />

          {/* ═══ Chat area ═══ */}
          <CardContent
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-5 bg-background/20 scrollbar-thin"
          >
            <AnimatePresence mode="popLayout">
              {messages.map((msg, index) => (
                <ChatMessage
                  key={`${msg.timestamp}-${index}`}
                  message={msg}
                  isUser={msg.role === 'user'}
                />
              ))}
            </AnimatePresence>

            {/* Loading indicator */}
            {isLoading && (
              <CyberLoadingScreen message={t('interview.loading')} />
            )}

            <div ref={messagesEndRef} />
          </CardContent>

          {/* ═══ Input area ═══ */}
          <div className="border-t border-white/5 bg-card/50 shrink-0">
            {/* Mode toggle tabs */}
            <div className="flex items-center gap-1 px-6 pt-3 pb-1">
              <button
                id="input-mode-text"
                onClick={() => setInputMode('text')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  inputMode === 'text'
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                }`}
              >
                <i className="fa-solid fa-keyboard text-[10px]" />
                {t('interview.mode.text')}
              </button>
              <button
                id="input-mode-code"
                onClick={() => setInputMode('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  inputMode === 'code'
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/60'
                }`}
              >
                <i className="fa-solid fa-code text-[10px]" />
                {t('interview.mode.code')}
              </button>
            </div>

            {/* Text input mode */}
            <AnimatePresence mode="wait">
              {inputMode === 'text' ? (
                <motion.div
                  key="text-input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="px-6 pb-4 pt-2"
                >
                  <div className="max-w-4xl mx-auto flex gap-3">
                    <Input
                      ref={inputRef}
                      id="interview-text-input"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('interview.placeholder')}
                      className="flex-1 py-6 px-4 text-base rounded-xl bg-background border-white/10 focus:border-primary/50 placeholder:text-muted-foreground/50"
                      disabled={isLoading}
                      autoFocus
                    />
                    <Button
                      id="interview-send-btn"
                      onClick={() => handleSend()}
                      disabled={isLoading || !inputText.trim()}
                      size="lg"
                      className="rounded-xl px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                    >
                      <i className="fa-solid fa-paper-plane mr-2" />
                      {t('interview.send')}
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="code-input"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="px-6 pb-4 pt-2"
                >
                  <div className="max-w-4xl mx-auto">
                    <CodeEditor
                      onSubmit={handleCodeSubmit}
                      disabled={isLoading}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
