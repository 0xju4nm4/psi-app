import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-transparent placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:bg-background aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex field-sizing-content min-h-16 w-full rounded-[10px] border bg-muted px-4 py-3 text-[17px] shadow-none transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-[15px]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
