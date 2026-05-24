import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import Editor from '@monaco-editor/react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { executeCode } from '@/lib/pistonApi'

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'rust', label: 'Rust' },
  { id: 'go', label: 'Go' },
  { id: 'solidity', label: 'Solidity' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
]

const DEFAULT_TEMPLATES = {
  javascript: '// Write your solution here\nfunction solution() {\n  \n}\n',
  python: '# Write your solution here\ndef solution():\n    pass\n',
  rust: '// Write your solution here\nfn solution() {\n    \n}\n',
  go: '// Write your solution here\npackage main\n\nfunc solution() {\n    \n}\n',
  solidity: '// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;\n\ncontract Solution {\n    \n}\n',
  typescript: '// Write your solution here\nfunction solution(): void {\n  \n}\n',
  java: '// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n',
  cpp: '// Write your solution here\n#include <iostream>\n\nint main() {\n    \n    return 0;\n}\n',
}

/**
 * CodeEditor — Monaco Editor wrapper for code interviews.
 *
 * @param {{ onSubmit: (code: string, language: string, output: string) => void, disabled: boolean }} props
 */
export default function CodeEditor({ onSubmit, disabled = false }) {
  const { t } = useI18n()
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(DEFAULT_TEMPLATES.javascript)
  
  // Execution states
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionOutput, setExecutionOutput] = useState(null)

  const handleLanguageChange = useCallback((langId) => {
    setLanguage(langId)
    setCode(DEFAULT_TEMPLATES[langId] || '')
  }, [])

  const handleClear = useCallback(() => {
    setCode(DEFAULT_TEMPLATES[language] || '')
    setExecutionOutput(null)
  }, [language])

  const handleRun = useCallback(async () => {
    if (!code.trim() || disabled) return
    setIsExecuting(true)
    setExecutionOutput(null)
    
    try {
      const result = await executeCode(language, code)
      setExecutionOutput(result)
    } catch (err) {
      setExecutionOutput({ run: { output: '', stderr: err.message }})
    } finally {
      setIsExecuting(false)
    }
  }, [code, language, disabled])

  const handleSubmit = useCallback(() => {
    if (!code.trim() || disabled) return
    // Pass output back to the parent to append to the AI prompt
    const outputString = executionOutput?.run?.output || ''
    onSubmit(code, language, outputString)
    
    // Reset after submit
    setCode(DEFAULT_TEMPLATES[language] || '')
    setExecutionOutput(null)
  }, [code, language, disabled, executionOutput, onSubmit])

  return (
    <motion.div
      id="code-editor-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="backdrop-blur-xl bg-card/60 border border-white/5 rounded-xl overflow-hidden shadow-lg"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-card/40">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-code text-primary text-sm" />
          <span className="text-sm font-medium text-foreground">
            {LANGUAGES.find((l) => l.id === language)?.label || language}
          </span>
        </div>
        <Button
          id="code-editor-clear-btn"
          variant="ghost"
          size="xs"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground text-xs"
        >
          <i className="fa-solid fa-eraser mr-1" />
          {t('interview.code.clear')}
        </Button>
      </div>

      {/* Language selector — pill buttons */}
      <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-white/5 bg-background/20">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.id}
            id={`lang-pill-${lang.id}`}
            onClick={() => handleLanguageChange(lang.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
              language === lang.id
                ? 'bg-primary text-primary-foreground shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                : 'bg-card/60 text-muted-foreground hover:text-foreground hover:bg-card border border-white/5'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Monaco Editor */}
      <div className="min-h-[200px]">
        <Editor
          height="200px"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={(value) => setCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            padding: { top: 12, bottom: 12 },
            renderLineHighlight: 'gutter',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            contextmenu: false,
            folding: true,
            bracketPairColorization: { enabled: true },
          }}
          loading={
            <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm font-mono">
              <i className="fa-solid fa-spinner fa-spin mr-2" />
              {t('common.loading')}
            </div>
          }
        />
      </div>

      {/* Submit bar */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/5 bg-card/40">
        <span className="text-[11px] text-muted-foreground/60 font-mono">
          {code.split('\n').length} lines
        </span>
        <div className="flex items-center gap-2">
          <Button
            id="code-run-btn"
            onClick={handleRun}
            disabled={disabled || !code.trim() || isExecuting}
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10"
          >
            {isExecuting ? (
              <i className="fa-solid fa-spinner fa-spin mr-2" />
            ) : (
              <i className="fa-solid fa-play mr-2" />
            )}
            {t('interview.code.run')}
          </Button>
          <Button
            id="code-submit-btn"
            onClick={handleSubmit}
            disabled={disabled || !code.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
          >
            <i className="fa-solid fa-terminal mr-2" />
            {t('interview.code.submit')}
          </Button>
        </div>
      </div>

      {/* Output Terminal Pane */}
      {executionOutput && (
        <div className="bg-[#0f111a] border-t border-white/10 p-4 max-h-[200px] overflow-y-auto font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-muted-foreground uppercase tracking-wider text-[10px] font-bold">{t('interview.code.output')}</span>
            {executionOutput.compile && executionOutput.compile.code !== 0 && (
              <span className="text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-[10px]">{t('interview.code.compile_error')}</span>
            )}
          </div>
          
          {executionOutput.compile?.stderr && (
            <pre className="text-red-400 whitespace-pre-wrap mb-2">{executionOutput.compile.stderr}</pre>
          )}
          
          {executionOutput.run?.stderr && (
            <pre className="text-red-400 whitespace-pre-wrap mb-2">{executionOutput.run.stderr}</pre>
          )}
          
          {executionOutput.run?.stdout && (
            <pre className="text-emerald-400 whitespace-pre-wrap">{executionOutput.run.stdout}</pre>
          )}

          {!executionOutput.compile?.stderr && !executionOutput.run?.stderr && !executionOutput.run?.stdout && (
            <span className="text-muted-foreground italic">{t('interview.code.no_output')}</span>
          )}
        </div>
      )}
    </motion.div>
  )
}
