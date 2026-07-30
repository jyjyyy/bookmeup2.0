"use client"

import { forwardRef, type InputHTMLAttributes } from "react"
import { cn } from "@/lib/utils/cn"

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-")
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          className={cn(
            "h-11 w-full rounded-[var(--radius-md)] px-4",
            "bg-[var(--bg-secondary)] text-[var(--text-primary)]",
            "border-2 border-[var(--border-default)]",
            "placeholder:text-[var(--text-muted)]",
            "transition-colors duration-200",
            "hover:border-[var(--border-subtle)]",
            "focus:border-[var(--border-accent)] focus:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error && "border-error focus:border-error",
            className
          )}
          ref={ref}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-[var(--text-muted)]">
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
