import { useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

const PARTICLE_COUNT = 80;
const CONNECTION_DISTANCE = 150;
const MOUSE_RADIUS = 200;
const MOUSE_FORCE = 0.02;
const PARTICLE_RADIUS = 2;
const LINE_WIDTH = 0.5;
const FRAME_INTERVAL = 1000 / 60; // 60fps cap

// oklch(0.65 0.25 265) ≈ rgb(56, 133, 255)
const PRIMARY_R = 56;
const PRIMARY_G = 133;
const PRIMARY_B = 255;

function createParticle(width, height) {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    opacity: Math.random() * 0.5 + 0.3,
  };
}

function ParticleBackground({ className }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const isVisibleRef = useRef(true);
  const lastFrameRef = useRef(0);
  const containerRef = useRef(null);

  const initParticles = useCallback((width, height) => {
    particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () =>
      createParticle(width, height)
    );
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      // Re-init particles if count doesn't match (first load or big resize)
      if (particlesRef.current.length === 0) {
        initParticles(width, height);
      }
    };

    resizeCanvas();

    const handleResize = () => {
      resizeCanvas();
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    // Animation loop
    const animate = (timestamp) => {
      animationRef.current = requestAnimationFrame(animate);

      // 60fps cap
      if (timestamp - lastFrameRef.current < FRAME_INTERVAL) return;
      lastFrameRef.current = timestamp;

      // Skip if not visible
      if (!isVisibleRef.current) return;

      const parent = canvas.parentElement;
      if (!parent) return;
      const { width, height } = parent.getBoundingClientRect();
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Update & draw particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse attraction
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          p.vx += (dx / dist) * MOUSE_FORCE;
          p.vy += (dy / dist) * MOUSE_FORCE;
        }

        // Damping to prevent runaway speeds
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off edges
        if (p.x < 0) { p.x = 0; p.vx *= -1; }
        if (p.x > width) { p.x = width; p.vx *= -1; }
        if (p.y < 0) { p.y = 0; p.vy *= -1; }
        if (p.y > height) { p.y = height; p.vy *= -1; }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${PRIMARY_R}, ${PRIMARY_G}, ${PRIMARY_B}, ${p.opacity})`;
        ctx.fill();
      }

      // Draw connections
      ctx.lineWidth = LINE_WIDTH;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const opacity = (1 - dist / CONNECTION_DISTANCE) * 0.35;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${PRIMARY_R}, ${PRIMARY_G}, ${PRIMARY_B}, ${opacity})`;
            ctx.stroke();
          }
        }
      }
    };

    // IntersectionObserver to pause when not visible
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.1 }
    );
    observer.observe(canvas);

    // Event listeners
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Start
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [initParticles]);

  return (
    <div
      ref={containerRef}
      className={cn('absolute inset-0 overflow-hidden pointer-events-none', className)}
      id="particle-background"
    >
      <canvas
        ref={canvasRef}
        className="pointer-events-auto"
        aria-hidden="true"
      />
    </div>
  );
}

export default ParticleBackground;
