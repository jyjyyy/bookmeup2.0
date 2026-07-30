"use client"

import { motion, type HTMLMotionProps } from "framer-motion"
import { type ReactNode } from "react"

/* ─────────────────────────────────────────────
   Animations réutilisables
   Règle : animer pour clarifier, pas décorer.
   ───────────────────────────────────────────── */

/** Fade-in + léger slide-up (8px) */
export function FadeIn({
  children,
  delay = 0,
  duration = 0.4,
  className,
  ...props
}: { children: ReactNode; delay?: number; duration?: number } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/** Stagger children with delay */
export function StaggerContainer({
  children,
  staggerDelay = 0.04,
  className,
}: {
  children: ReactNode
  staggerDelay?: number
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Individual stagger item */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 8 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Scale-in pour confirmations */
export function ScaleIn({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
