import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

/**
 * ChatMessage — A single chat bubble for the CyberVett interview room.
 *
 * @param {{ message: { role: 'user'|'ai', text: string, timestamp: number }, isUser: boolean }} props
 */
export default function ChatMessage({ message, isUser }) {
  const formatTime = (ts) => {
    if (!ts) return ''
    const d = new Date(ts)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <motion.div
      id={`chat-msg-${message.timestamp}`}
      initial={{ opacity: 0, x: isUser ? 40 : -40, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* Avatar */}
        {isUser ? (
          <div className="w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-xs font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            ME
          </div>
        ) : (
          <div className="relative w-8 h-8 rounded-full flex shrink-0 items-center justify-center text-xs font-bold bg-card text-primary border border-primary/30 shadow-lg shadow-primary/10">
            AI
            {/* Pulsing online dot */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div className="flex flex-col gap-1">
          <div
            className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
              isUser
                ? 'bg-primary text-primary-foreground rounded-tr-none'
                : 'backdrop-blur-xl bg-card/60 border border-white/5 shadow-[0_0_15px_rgba(59,130,246,0.08)] text-card-foreground rounded-tl-none'
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg my-2 !text-sm"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className="bg-primary/20 px-1.5 py-0.5 rounded text-primary font-mono text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  )
                },
                // Style markdown elements within bubbles
                p({ children }) {
                  return <p className="mb-2 last:mb-0">{children}</p>
                },
                ul({ children }) {
                  return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                },
                ol({ children }) {
                  return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                },
                a({ href, children }) {
                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
                      {children}
                    </a>
                  )
                },
                blockquote({ children }) {
                  return (
                    <blockquote className="border-l-2 border-primary/50 pl-3 my-2 italic text-muted-foreground">
                      {children}
                    </blockquote>
                  )
                },
              }}
            >
              {message.text}
            </ReactMarkdown>
          </div>

          {/* Timestamp */}
          <span
            className={`text-[10px] text-muted-foreground/60 font-mono ${
              isUser ? 'text-right pr-1' : 'text-left pl-1'
            }`}
          >
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
