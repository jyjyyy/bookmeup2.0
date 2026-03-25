import { ReactNode, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  hover?: boolean
}

// Card sans Framer Motion pour éviter le flash au re-render
export function Card({ children, className = '', hover = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-[32px] shadow-bookmeup border border-white/50 p-8',
        hover && 'hover:shadow-bookmeup-lg transition-shadow duration-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardHeader({ children, className = '', ...props }: CardHeaderProps) {
  return (
    <div className={cn('mb-6', className)} {...props}>
      {children}
    </div>
  )
}

interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode
}

export function CardTitle({ children, className = '', ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-2xl font-bold text-slate-900', className)} {...props}>
      {children}
    </h3>
  )
}

interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode
}

export function CardDescription({ children, className = '', ...props }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-slate-600 mt-2', className)} {...props}>
      {children}
    </p>
  )
}

interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardContent({ children, className = '', ...props }: CardContentProps) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}
