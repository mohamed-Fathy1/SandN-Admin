import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

interface FloatingOrbProps {
  size: number;
  color: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  delay?: number;
  opacity?: number;
  blur?: number;
}

export function FloatingOrb({
  size,
  color,
  top,
  left,
  right,
  bottom,
  delay = 0,
  opacity = 0.5,
  blur,
}: FloatingOrbProps) {
  const reduced = usePrefersReducedMotion();
  const blurAmount = blur ?? size * 0.3;

  const animate = reduced
    ? undefined
    : { y: [0, -20, 10, -15, 0], scale: [1, 1.08, 0.95, 1.04, 1] };

  return (
    <motion.div
      aria-hidden
      animate={animate}
      transition={
        reduced
          ? undefined
          : { duration: 12 + delay * 3, repeat: Infinity, ease: 'easeInOut' }
      }
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        filter: `blur(${blurAmount}px)`,
        opacity,
        top,
        left,
        right,
        bottom,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
