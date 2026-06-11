import { ReactNode, ButtonHTMLAttributes } from "react";

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
}

export default function PremiumButton({ children, variant = "primary", size = "md", icon, className = "", ...props }: PremiumButtonProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none";

  const variantClasses = {
    primary: "bg-gradient-to-r from-[#556B2F] to-[#355E3B] text-white shadow-md shadow-[#556B2F]/20 hover:shadow-lg hover:shadow-[#556B2F]/30",
    secondary: "bg-white text-[#2d4a2e] border border-[#e8ede5] shadow-sm hover:border-[#8FA28B]/40 hover:shadow-md",
    ghost: "bg-[#556B2F]/5 text-[#355E3B] hover:bg-[#556B2F]/10",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/30",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-2.5 text-base gap-2",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
