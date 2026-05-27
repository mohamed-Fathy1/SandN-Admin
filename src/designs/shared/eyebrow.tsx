import { cn } from '@/shared/utils/cn';

type EyebrowTone = 'default' | 'muted' | 'accent';

interface EyebrowProps extends React.HTMLAttributes<HTMLElement> {
  as?: 'span' | 'div' | 'p' | 'label';
  tone?: EyebrowTone;
  className?: string;
  children: React.ReactNode;
}

const TONE: Record<EyebrowTone, string> = {
  default: 'text-foreground',
  muted: 'text-muted-foreground',
  accent: 'text-accent',
};

export function Eyebrow({
  as: Tag = 'span',
  tone = 'muted',
  className,
  children,
  ...rest
}: EyebrowProps) {
  return (
    <Tag className={cn('text-eyebrow', TONE[tone], className)} {...rest}>
      {children}
    </Tag>
  );
}
