import * as React from "react"
import { cn } from "@/lib/utils"

function getInitials(name) {
  if (!name) return "?"
  const parts = name.trim().split(" ")
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

// Generate consistent background color based on name string
function getAvatarColor(name) {
  if (!name) return "bg-slate-500"
  const colors = [
    "bg-blue-600 text-white",
    "bg-emerald-600 text-white",
    "bg-indigo-600 text-white",
    "bg-purple-600 text-white",
    "bg-rose-600 text-white",
    "bg-amber-600 text-white",
    "bg-teal-600 text-white",
    "bg-violet-600 text-white",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const Avatar = React.forwardRef(
  ({ className, name, src, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-8 w-8 text-xs",
      md: "h-10 w-10 text-sm",
      lg: "h-12 w-12 text-base",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold shadow-sm select-none",
          sizeClasses[size],
          !src && getAvatarColor(name),
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name || "Avatar"}
            className="aspect-square h-full w-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
    )
  }
)
Avatar.displayName = "Avatar"

export { Avatar }
