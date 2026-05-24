import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { saveSession, loadSession, clearSession } from '@/lib/sessionPersistence'

const InterviewContext = createContext(null)

export function InterviewProvider({ children }) {
  const [sessionId, setSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isActive, setIsActive] = useState(false)
  const [config, setConfig] = useState({ resumeContext: '', language: 'en', customConfig: null })
  const [antiCheatLog, setAntiCheatLog] = useState([])
  const [startTime, setStartTime] = useState(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef(null)

  // Timer
  useEffect(() => {
    if (isActive && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [isActive, startTime])

  // Auto-save to localStorage on message changes
  useEffect(() => {
    if (sessionId && messages.length > 0) {
      saveSession(sessionId, { messages, config, antiCheatLog, startTime })
    }
  }, [messages, antiCheatLog, sessionId, config, startTime])

  const startInterview = useCallback((resumeContext = '', language = 'en', customConfig = null) => {
    const id = uuidv4()
    setSessionId(id)
    setMessages([])
    setConfig({ resumeContext, language, customConfig })
    setAntiCheatLog([])
    setStartTime(Date.now())
    setElapsedSeconds(0)
    setIsActive(true)
    return id
  }, [])

  const resumeInterview = useCallback((savedSessionId) => {
    const data = loadSession(savedSessionId)
    if (data) {
      setSessionId(savedSessionId)
      setMessages(data.messages || [])
      setConfig(data.config || { resumeContext: '', language: 'en', customConfig: null })
      setAntiCheatLog(data.antiCheatLog || [])
      setStartTime(data.startTime || Date.now())
      setIsActive(true)
      return true
    }
    return false
  }, [])

  const addMessage = useCallback((role, text) => {
    setMessages(prev => [...prev, { role, text, timestamp: Date.now() }])
  }, [])

  const logAntiCheatEvent = useCallback((type, details = {}) => {
    setAntiCheatLog(prev => [...prev, { type, timestamp: Date.now(), ...details }])
  }, [])

  const endInterview = useCallback(() => {
    setIsActive(false)
    clearInterval(timerRef.current)
    if (sessionId) clearSession(sessionId)
  }, [sessionId])

  const roundCount = messages.filter(m => m.role === 'user').length

  return (
    <InterviewContext.Provider value={{
      sessionId,
      messages,
      isActive,
      config,
      antiCheatLog,
      startTime,
      elapsedSeconds,
      roundCount,
      startInterview,
      resumeInterview,
      addMessage,
      setMessages,
      logAntiCheatEvent,
      endInterview,
    }}>
      {children}
    </InterviewContext.Provider>
  )
}

export function useInterview() {
  const ctx = useContext(InterviewContext)
  if (!ctx) throw new Error('useInterview must be used within InterviewProvider')
  return ctx
}
