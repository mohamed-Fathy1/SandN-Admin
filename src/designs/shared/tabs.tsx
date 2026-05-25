import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/shared/utils/cn';

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    className={cn(
      'inline-flex h-10 items-center justify-start gap-1 rounded-full border border-border bg-card p-1 shadow-[0_1px_0_rgba(64,20,35,0.02)]',
      className
    )}
    {...props}
  />
);

export const TabsTrigger = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      'inline-flex h-8 items-center justify-center rounded-full px-3.5 text-xs font-semibold tracking-wide text-muted-foreground transition-[color,background-color,box-shadow] duration-200',
      'hover:text-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
      'data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-accent',
      'disabled:pointer-events-none disabled:opacity-50',
      className
    )}
    {...props}
  />
);

export const TabsContent = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content
    className={cn(
      'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
      className
    )}
    {...props}
  />
);
