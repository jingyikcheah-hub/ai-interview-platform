import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const DEFAULT_MESSAGES = [
  '> Analyzing neural response vectors...',
  '> Cross-referencing architecture patterns...',
  '> Evaluating security posture...',
  '> Generating targeted question matrix...',
  '> Scanning knowledge graph nodes...',
  '> Mapping exploit surface topology...',
  '> Correlating threat intelligence feeds...',
  '> Decompiling behavioral heuristics...',
  '> Profiling adversarial attack vectors...',
  '> Synthesizing assessment protocol...',
];

const TYPING_SPEED = 35; // ms per character
const MESSAGE_PAUSE = 800; // ms pause between messages
const PROGRESS_INTERVAL = 120; // ms per progress tick
const MAX_VISIBLE_LINES = 6;

function CyberLoadingScreen({ message, className }) {
  const messages = message ? [message] : DEFAULT_MESSAGES;

  const [displayedLines, setDisplayedLines] = useState([]);
  const [currentLine, setCurrentLine] = useState('');
  const [progress, setProgress] = useState(0);
  const messageIndexRef = useRef(0);
  const charIndexRef = useRef(0);
  const typingTimerRef = useRef(null);
  const progressTimerRef = useRef(null);

  // Typewriter effect
  const typeNextChar = useCallback(() => {
    const msgIdx = messageIndexRef.current;
    const fullMessage = messages[msgIdx % messages.length];
    const charIdx = charIndexRef.current;

    if (charIdx < fullMessage.length) {
      setCurrentLine(fullMessage.slice(0, charIdx + 1));
      charIndexRef.current = charIdx + 1;
      typingTimerRef.current = setTimeout(typeNextChar, TYPING_SPEED);
    } else {
      // Line done — push to displayed lines and start next
      typingTimerRef.current = setTimeout(() => {
        setDisplayedLines((prev) => {
          const next = [...prev, fullMessage];
          // Keep only last N lines visible
          return next.length > MAX_VISIBLE_LINES
            ? next.slice(next.length - MAX_VISIBLE_LINES)
            : next;
        });
        setCurrentLine('');
        messageIndexRef.current = msgIdx + 1;
        charIndexRef.current = 0;
        typingTimerRef.current = setTimeout(typeNextChar, 200);
      }, MESSAGE_PAUSE);
    }
  }, [messages]);

  // Start typewriter
  useEffect(() => {
    typingTimerRef.current = setTimeout(typeNextChar, 400);
    return () => {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [typeNextChar]);

  // Progress bar (fake — loops between 15-95%)
  useEffect(() => {
    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 15 + Math.random() * 10;
        return prev + Math.random() * 3 + 0.5;
      });
    }, PROGRESS_INTERVAL);
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Build progress bar visual
  const progressPercent = Math.min(Math.floor(progress), 99);
  const barLength = 24;
  const filled = Math.round((progressPercent / 100) * barLength);
  const empty = barLength - filled;
  const progressBar = `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${progressPercent}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-xl p-6 scan-lines',
        'glass-panel neon-border',
        'max-w-lg w-full mx-auto',
        className
      )}
      id="cyber-loading-screen"
    >
      {/* Terminal output */}
      <div className="font-mono text-sm space-y-1.5 mb-5 min-h-[160px]">
        {/* Previously completed lines */}
        {displayedLines.map((line, idx) => (
          <div
            key={`line-${idx}-${line.slice(0, 10)}`}
            className="text-primary/60 leading-relaxed"
          >
            {line}
          </div>
        ))}

        {/* Currently typing line */}
        {currentLine && (
          <div className="text-primary leading-relaxed">
            {currentLine}
            <span className="inline-block w-2 h-4 ml-0.5 bg-primary align-middle animate-typing-cursor" />
          </div>
        )}

        {/* Blinking cursor when idle between messages */}
        {!currentLine && displayedLines.length > 0 && (
          <div className="text-primary leading-relaxed">
            <span className="inline-block w-2 h-4 bg-primary align-middle animate-typing-cursor" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="font-mono text-xs text-primary/80 mb-6 tracking-wider">
        {progressBar}
      </div>

      {/* Pulsing glow orb */}
      <div className="flex justify-center">
        <div className="relative">
          <div
            className="w-10 h-10 rounded-full animate-pulse-glow"
            style={{
              background:
                'radial-gradient(circle, oklch(0.65 0.25 265 / 80%) 0%, oklch(0.65 0.25 265 / 20%) 50%, transparent 70%)',
            }}
          />
          {/* Inner bright core */}
          <div
            className="absolute inset-2.5 rounded-full"
            style={{
              background:
                'radial-gradient(circle, oklch(0.85 0.15 265) 0%, oklch(0.65 0.25 265 / 60%) 100%)',
            }}
          />
        </div>
      </div>

      {/* Scan line sweep animation */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, oklch(0.65 0.25 265 / 3%) 50%, transparent 100%)',
          animation: 'scan-line 4s linear infinite',
        }}
      />
    </motion.div>
  );
}

export default CyberLoadingScreen;
