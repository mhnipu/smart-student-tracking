'use client';

import * as React from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

import { cn } from '@/lib/utils';

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => {
  // Extract color-related classes from className
  const classNames = className?.split(' ') || [];
  const colorClasses = classNames.filter(cls => 
    cls.startsWith('bg-') || 
    cls.startsWith('green-') || 
    cls.startsWith('blue-') || 
    cls.startsWith('red-') || 
    cls.startsWith('yellow-') || 
    cls.startsWith('orange-')
  );
  
  // Remove color classes from the root className
  const rootClasses = classNames.filter(cls => !colorClasses.includes(cls)).join(' ');
  
  return (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      'relative h-4 w-full overflow-hidden rounded-full bg-secondary',
        rootClasses
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 bg-primary transition-all",
          colorClasses.join(' ')
        )}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
