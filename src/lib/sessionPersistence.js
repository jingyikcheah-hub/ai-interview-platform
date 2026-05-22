const STORAGE_PREFIX = 'cybervett_session_'

export function saveSession(sessionId, data) {
  try {
    const key = STORAGE_PREFIX + sessionId
    const payload = JSON.stringify({
      ...data,
      updatedAt: Date.now(),
    })
    localStorage.setItem(key, payload)
    // Also store the active session ID for recovery
    localStorage.setItem('cybervett_active_session', sessionId)
  } catch (e) {
    console.warn('Failed to save session to localStorage:', e)
  }
}

export function loadSession(sessionId) {
  try {
    const key = STORAGE_PREFIX + sessionId
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (e) {
    console.warn('Failed to load session from localStorage:', e)
    return null
  }
}

export function clearSession(sessionId) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + sessionId)
    const activeId = localStorage.getItem('cybervett_active_session')
    if (activeId === sessionId) {
      localStorage.removeItem('cybervett_active_session')
    }
  } catch (e) {
    console.warn('Failed to clear session from localStorage:', e)
  }
}

export function getActiveSessionId() {
  try {
    const sessionId = localStorage.getItem('cybervett_active_session')
    if (!sessionId) return null
    // Verify the session data still exists
    const data = loadSession(sessionId)
    if (!data) {
      localStorage.removeItem('cybervett_active_session')
      return null
    }
    // Check if session is older than 24 hours
    if (data.updatedAt && Date.now() - data.updatedAt > 24 * 60 * 60 * 1000) {
      clearSession(sessionId)
      return null
    }
    return sessionId
  } catch (e) {
    return null
  }
}
