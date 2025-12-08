'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'
import { HTMLMotionProps, motion } from 'framer-motion'

interface ButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode
  variant?: 'primary' | 'outline' | 'subtle'
  size?: 'sm' | 'md' | 'lg'
}


export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'rounded-[32px] font-medium transition-all duration-200 relative overflow-hidden'
  
  const sizes = {
    sm: 'px-5 py-2.5 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-[#e56aa5] hover:shadow-[0_8px_25px_rgba(243,125,185,0.3)] active:scale-[0.98]',
    outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary hover:text-white hover:shadow-[0_8px_25px_rgba(243,125,185,0.2)] active:scale-[0.98]',
    subtle: 'bg-white text-primary border border-primary/20 hover:bg-primary/5 hover:border-primary/40 active:scale-[0.98]',
  }

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

