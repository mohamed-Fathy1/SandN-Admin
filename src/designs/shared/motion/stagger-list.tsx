import { Children, isValidElement } from 'react';
import { FadeUp } from './fade-up';

interface StaggerListProps {
  children: React.ReactNode;
  /** Per-item delay step in seconds (default 0.05). */
  stagger?: number;
  /** Cap stagger to first N items so paginated views stay snappy (default 12). */
  cap?: number;
  className?: string;
  style?: React.CSSProperties;
  y?: number;
}

export function StaggerList({
  children,
  stagger = 0.05,
  cap = 12,
  className,
  style,
  y,
}: StaggerListProps) {
  return (
    <div className={className} style={style}>
      {Children.map(children, (child, i) => {
        if (!isValidElement(child)) return child;
        const delay = Math.min(i, cap) * stagger;
        return (
          <FadeUp key={i} delay={delay} y={y}>
            {child}
          </FadeUp>
        );
      })}
    </div>
  );
}
