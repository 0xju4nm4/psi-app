import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[15px] font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-card text-primary border border-[#EFEFEF] hover:bg-primary/5",
        destructive:
          "bg-card text-destructive border border-[#EFEFEF] hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "bg-card border border-[#EFEFEF] hover:bg-muted/50 hover:text-accent-foreground dark:hover:bg-muted/50",
        secondary:
          "bg-card text-secondary-foreground border border-[#EFEFEF] hover:bg-muted/50",
        ghost:
          "bg-card border border-[#EFEFEF] hover:bg-muted/50 hover:text-accent-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5 has-[>svg]:px-4",
        xs: "h-7 gap-1 rounded-lg px-2.5 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 rounded-lg gap-1.5 px-3.5 has-[>svg]:px-2.5",
        lg: "h-12 rounded-xl px-8 has-[>svg]:px-5",
        icon: "size-11",
        "icon-xs": "size-7 rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
