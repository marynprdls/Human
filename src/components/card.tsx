"use client"

import type React from "react"

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: "none" | "sm" | "md" | "lg"
}

export default function Card({ children, className = "", padding = "md" }: CardProps) {
  const paddingClasses = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  }

  return (
    <div className={`bg-card rounded-3xl border border-border ${paddingClasses[padding]} ${className}`}>{children}</div>
  )
}
