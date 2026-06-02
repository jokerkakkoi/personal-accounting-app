import * as React from "react"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const clampedValue = Math.max(0, Math.min(100, value || 0));

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-md bg-muted",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - clampedValue}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
