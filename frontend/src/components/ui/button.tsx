/**
 * Button Component
 * A versatile button component with multiple variants and sizes
 * 
 * @example
 * ```tsx
 * <Button variant="default" size="default">Click me</Button>
 * <Button variant="outline" size="sm">Small Outline</Button>
 * <Button asChild><a href="/link">Link Button</a></Button>
 * ```
 */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Button component props
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether to render as a child component ( Slot ) */
  asChild?: boolean
  /** Visual style variant of the button */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  /** Size of the button */
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    function cn(...inputs: ClassValue[]) {
      return twMerge(clsx(inputs))
    }
    
    const variants = {
      default: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-900/20",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20",
      outline: "border border-white/10 bg-transparent hover:bg-white/5 text-slate-300",
      secondary: "bg-slate-800 text-white hover:bg-slate-700",
      ghost: "hover:bg-white/5 text-slate-400 hover:text-white",
      link: "text-indigo-400 underline-offset-4 hover:underline",
    }

    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-xs",
      lg: "h-12 px-8 text-lg",
      icon: "h-10 w-10",
    }

    return (
      <Comp
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-sm font-black uppercase tracking-widest ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
