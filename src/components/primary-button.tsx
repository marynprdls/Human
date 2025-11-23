import type React from "react"
import { Link } from "react-router-dom"
import { logger } from '../utils/logger'

interface PrimaryButtonProps {
  children: React.ReactNode
  href?: string
  onClick?: () => void
  variant?: "primary" | "secondary" | "outline"
  fullWidth?: boolean
  className?: string
  disabled?: boolean
}

export default function PrimaryButton({
  children,
  href,
  onClick,
  variant = "primary",
  fullWidth = true,
  className = "",
  disabled = false,
}: PrimaryButtonProps) {
  const baseStyles = "px-8 py-4 rounded-2xl font-semibold text-lg transition-all active:scale-95"

  const variants = {
    primary: "bg-foreground text-background hover:bg-foreground/90",
    secondary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "bg-transparent border-2 border-foreground text-foreground hover:bg-foreground hover:text-background",
  }

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : ""
  const widthClass = fullWidth ? "w-full" : ""
  const finalClassName = `${baseStyles} ${variants[variant]} ${widthClass} ${disabledStyles} ${className}`

  if (href) {
    return (
      <Link to={href} className={finalClassName}>
        {children}
      </Link>
    )
  }

  return (
    <button
      onClick={(e) => {
        logger.log('🔘 Button clicked!', e);
        onClick?.();
      }}
      disabled={disabled}
      className={finalClassName}
      type="button"
    >
      {children}
    </button>
  )
}
