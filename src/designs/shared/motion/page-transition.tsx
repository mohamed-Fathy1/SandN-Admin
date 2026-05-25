import { motion } from 'framer-motion';
import { A } from '@/designs/layout/tokens';
import { usePrefersReducedMotion } from './use-prefers-reduced-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const reduced = usePrefersReducedMotion();
  const y = reduced ? 0 : 8;

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: A.motionDuration.fast, ease: A.easeOut }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
