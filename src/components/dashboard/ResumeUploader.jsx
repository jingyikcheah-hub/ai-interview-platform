import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'
import { parsePDF, fetchGitHubProfile, githubProfileToContext, extractSkillTags } from '@/lib/resumeParser'

const TABS = [
  { id: 'paste', icon: 'fa-solid fa-keyboard', labelKey: 'resume.tab.paste' },
  { id: 'pdf', icon: 'fa-solid fa-file-pdf', labelKey: 'resume.tab.pdf' },
  { id: 'github', icon: 'fa-brands fa-github', labelKey: 'resume.tab.github' },
]

const TAB_LABELS = {
  paste: { en: 'Paste', cn: '粘贴' },
  pdf: { en: 'PDF', cn: 'PDF' },
  github: { en: 'GitHub', cn: 'GitHub' },
}

const tabContentVariants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.98, transition: { duration: 0.2, ease: 'easeIn' } },
}

function ResumeUploader({ onContextReady }) {
  const { t, lang } = useI18n()

  // Shared state
  const [activeTab, setActiveTab] = useState('paste')
  const [contextString, setContextString] = useState('')
  const [skillTags, setSkillTags] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')

  // Paste mode
  const [pasteText, setPasteText] = useState('')

  // PDF mode
  const [pdfFileName, setPdfFileName] = useState('')
  const [pdfPreview, setPdfPreview] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef(null)

  // GitHub mode
  const [githubUsername, setGithubUsername] = useState('')
  const [githubProfile, setGithubProfile] = useState(null)

  // ---------- Shared handlers ----------
  const processContext = useCallback((text) => {
    const tags = extractSkillTags(text)
    setSkillTags(tags)
    setContextString(text)
    onContextReady?.(text, tags)
  }, [onContextReady])

  // ---------- Paste handlers ----------
  const handlePasteSubmit = useCallback(() => {
    if (!pasteText.trim()) return
    setError('')
    processContext(pasteText.trim())
  }, [pasteText, processContext])

  // ---------- PDF handlers ----------
  const handlePDFFile = useCallback(async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      setError(lang === 'en' ? 'Please select a valid PDF file.' : '请选择有效的 PDF 文件。')
      return
    }
    setError('')
    setIsProcessing(true)
    setPdfFileName(file.name)
    try {
      const text = await parsePDF(file)
      const truncated = text.length > 500 ? text.slice(0, 500) + '…' : text
      setPdfPreview(truncated)
      processContext(text)
    } catch (err) {
      console.error('PDF parse error:', err)
      setError(lang === 'en' ? 'Failed to parse PDF. Try pasting text instead.' : 'PDF 解析失败，请尝试粘贴文本。')
    } finally {
      setIsProcessing(false)
    }
  }, [lang, processContext])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handlePDFFile(file)
  }, [handlePDFFile])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  // ---------- GitHub handlers ----------
  const handleGitHubScan = useCallback(async () => {
    if (!githubUsername.trim()) return
    setError('')
    setIsProcessing(true)
    setGithubProfile(null)
    try {
      const profile = await fetchGitHubProfile(githubUsername.trim())
      setGithubProfile(profile)
      const ctx = githubProfileToContext(profile)
      processContext(ctx)
    } catch (err) {
      console.error('GitHub fetch error:', err)
      setError(lang === 'en' ? `GitHub user "${githubUsername}" not found.` : `未找到 GitHub 用户 "${githubUsername}"。`)
    } finally {
      setIsProcessing(false)
    }
  }, [githubUsername, lang, processContext])

  return (
    <Card
      id="resume-uploader"
      className="relative overflow-hidden border-primary/20 bg-card/60 backdrop-blur-xl shadow-[0_0_30px_rgba(59,130,246,0.08)]"
    >
      {/* Decorative neon glow */}
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />

      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <i className="fa-solid fa-code text-primary" />
          {t('dash.resume.title')}
        </CardTitle>
        <CardDescription>{t('dash.resume.desc')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Segmented Tab Control ── */}
        <div
          id="resume-tab-bar"
          className="flex rounded-lg border border-white/5 bg-background/60 p-1"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`resume-tab-${tab.id}`}
              onClick={() => { setActiveTab(tab.id); setError('') }}
              className={`
                relative flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200
                ${activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }
              `}
            >
              <i className={tab.icon} />
              <span className="hidden sm:inline">{TAB_LABELS[tab.id][lang] || TAB_LABELS[tab.id].en}</span>
            </button>
          ))}
        </div>

        {/* ── Tab Content with AnimatePresence ── */}
        <AnimatePresence mode="wait">
          {/* ===== PASTE MODE ===== */}
          {activeTab === 'paste' && (
            <motion.div
              key="paste"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-3"
            >
              <Textarea
                id="resume-paste-input"
                placeholder={t('dash.resume.placeholder')}
                className="min-h-[140px] resize-none border-border bg-background/50 font-mono text-sm focus:border-primary/50"
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
              />
              <Button
                id="resume-paste-submit"
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                size="sm"
              >
                <i className="fa-solid fa-bolt mr-2" />
                {lang === 'en' ? 'Extract & Inject' : '提取并注入'}
              </Button>
            </motion.div>
          )}

          {/* ===== PDF UPLOAD MODE ===== */}
          {activeTab === 'pdf' && (
            <motion.div
              key="pdf"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-3"
            >
              {/* Drop zone */}
              <div
                id="resume-pdf-dropzone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  group flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300
                  ${isDragging
                    ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                    : 'border-white/10 bg-background/30 hover:border-primary/40 hover:bg-primary/5'
                  }
                  ${isProcessing ? 'pointer-events-none opacity-60' : ''}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePDFFile(file)
                  }}
                />

                {isProcessing ? (
                  <div className="flex flex-col items-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin text-3xl text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {lang === 'en' ? 'Parsing PDF...' : '正在解析 PDF...'}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-card/80 transition-colors group-hover:border-primary/30 group-hover:bg-primary/10">
                      <i className="fa-solid fa-cloud-arrow-up text-2xl text-primary/70 group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {lang === 'en' ? 'Drop PDF here or click to browse' : '拖放 PDF 文件或点击选择'}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lang === 'en' ? 'Supports single-page and multi-page resumes' : '支持单页和多页简历'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* PDF parsed preview */}
              {pdfFileName && pdfPreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="rounded-lg border border-white/5 bg-background/40 p-3"
                >
                  <div className="mb-2 flex items-center gap-2 text-xs text-primary">
                    <i className="fa-solid fa-file-pdf" />
                    <span className="font-medium">{pdfFileName}</span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground line-clamp-6">
                    {pdfPreview}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ===== GITHUB MODE ===== */}
          {activeTab === 'github' && (
            <motion.div
              key="github"
              variants={tabContentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="space-y-4"
            >
              <div className="flex gap-2">
                <Input
                  id="resume-github-input"
                  placeholder={lang === 'en' ? 'GitHub username' : 'GitHub 用户名'}
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGitHubScan()}
                  className="flex-1 border-border bg-background/50 focus:border-primary/50"
                />
                <Button
                  id="resume-github-scan"
                  onClick={handleGitHubScan}
                  disabled={!githubUsername.trim() || isProcessing}
                  className="bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                  size="sm"
                >
                  {isProcessing ? (
                    <i className="fa-solid fa-spinner fa-spin" />
                  ) : (
                    <>
                      <i className="fa-solid fa-satellite-dish mr-2" />
                      {lang === 'en' ? 'Scan Profile' : '扫描'}
                    </>
                  )}
                </Button>
              </div>

              {/* GitHub profile card */}
              {githubProfile && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-white/5 bg-background/40 p-4"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={githubProfile.avatarUrl}
                      alt={githubProfile.name}
                      className="h-14 w-14 rounded-full border-2 border-primary/30 shadow-lg shadow-primary/10"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-bold text-foreground">{githubProfile.name}</h4>
                      {githubProfile.bio && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{githubProfile.bio}</p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {githubProfile.topLanguages.map((lang) => (
                          <span
                            key={lang}
                            className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary"
                          >
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right">
                      <span className="text-lg font-mono font-bold text-foreground">{githubProfile.publicRepos}</span>
                      <span className="text-[10px] text-muted-foreground">{lang === 'en' ? 'repos' : '仓库'}</span>
                    </div>
                  </div>

                  {/* Top repos */}
                  {githubProfile.repos.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {lang === 'en' ? 'Top Repositories' : '热门仓库'}
                      </span>
                      {githubProfile.repos.slice(0, 4).map((repo) => (
                        <div
                          key={repo.name}
                          className="flex items-center justify-between rounded-md bg-card/40 px-2.5 py-1.5 text-xs"
                        >
                          <span className="truncate font-medium text-foreground">{repo.name}</span>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="text-primary/80">{repo.language}</span>
                            <span>★ {repo.stars}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error display ── */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs text-destructive"
          >
            <i className="fa-solid fa-triangle-exclamation mr-1" />
            {error}
          </motion.p>
        )}

        {/* ── Skill Tags ── */}
        {skillTags.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-2"
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {lang === 'en' ? 'Detected Skills' : '识别技能'}
            </span>
            <div id="resume-skill-tags" className="flex flex-wrap gap-1.5">
              {skillTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary shadow-sm shadow-primary/5"
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Context Preview ── */}
        {contextString && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {lang === 'en' ? 'Context Payload' : '上下文载荷'}
              </span>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div
              id="resume-context-preview"
              className="max-h-32 overflow-y-auto rounded-lg border border-white/5 bg-background/50 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground scrollbar-thin"
            >
              {contextString.length > 600
                ? contextString.slice(0, 600) + '…'
                : contextString
              }
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

export default ResumeUploader
