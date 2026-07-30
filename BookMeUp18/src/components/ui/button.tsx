"use client"

import { forwardRef, type ButtonHTMLAttributes } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils/cn"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-medium whitespace-nowrap select-none",
    "transition-all duration-200 ease-out",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:opacity-50 disabled:pointer-events-none",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]",
          "hover:bg-[var(--btn-primary-hover)]",
          "focus-visible:outline-[var(--ring-color)]",
          "shadow-sm hover:shadow-md",
        ],
        secondary: [
          "bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)]",
          "hover:bg-[var(--btn-secondary-hover)]",
          "focus-visible:outline-[var(--ring-color)]",
        ],
        outline: [
          "border-2 border-[var(--border-default)]",
          "text-[var(--text-primary)]",
          "hover:bg-[var(--bg-tertiary)] hover:border-[var(--border-accent)]",
          "focus-visible:outline-[var(--ring-color)]",
        ],
        ghost: [
          "text-[var(--text-secondary)]",
          "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
        ],
        danger: [
          "bg-error/10 text-error",
          "hover:bg-error/20",
          "focus-visible:outline-error",
        ],
        link: [
          "text-[var(--text-accent)] underline-offset-4",
          "hover:underline",
          "p-0 h-auto",
        ],
      },
      size: {
        sm: "h-9 px-3 text-sm rounded-[var(--radius-sm)]",
        md: "h-11 px-5 text-sm rounded-[var(--radius-md)]",
        lg: "h-13 px-7 text-base rounded-[var(--radius-md)]",
        xl: "h-14 px-8 text-lg rounded-[var(--radius-lg)]",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
