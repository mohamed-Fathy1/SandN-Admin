import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { A } from '@/designs/layout/tokens';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Viewport margin offset for trigger (default '-40px'). */
  margin?: `${number}px`;
  /** Travel distance in px (default 18). */
  y?: number;
  duration?: number;
}

export function FadeUp({
  children,
  delay = 0,
  className,
  style,
  margin = '-40px',
  y = 18,
  duration = A.motionDuration.slow,
}: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin });
  const reduced = usePrefersReducedMotion();
  const travel = reduced ? 0 : y;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: travel }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: travel }}
      transition={{ duration, delay, ease: A.easeOut }}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
