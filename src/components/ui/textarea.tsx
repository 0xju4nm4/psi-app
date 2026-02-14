import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:ring-destructive flex field-sizing-content min-h-16 w-full rounded-[10px] border border-[#EFEFEF] bg-card px-4 py-3 text-[17px] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-[15px]",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
