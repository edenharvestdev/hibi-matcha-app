import { ReactNode } from "react";

interface PremiumCardProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function PremiumCard({ children, className = "", accent = false, onClick, style }: PremiumCardProps) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-sm border border-[#e8ede5]/60 transition-all duration-300 hover:shadow-md hover:border-[#8FA28B]/30 overflow-hidden ${onClick ? "cursor-pointer hover:scale-[1.01] active:scale-[0.99]" : ""} ${className}`}
    >
      {accent && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#556B2F] to-[#8FA28B]" />
      )}
      {children}
    </div>
  );
}

interface PremiumListItemProps {
  children: ReactNode;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  trailing?: ReactNode;
  index?: number;
}

export function PremiumListItem({ children, icon, title, subtitle, onClick, trailing, index = 0 }: PremiumListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 hover:bg-[#556B2F]/5 ${onClick ? "cursor-pointer active:scale-[0.99]" : ""}`}
      style={{ animation: `fadeSlideIn 0.3s ease-out ${index * 0.03}s both` }}
    >
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#556B2F]/10 to-[#8FA28B]/10 flex items-center justify-center ring-1 ring-[#8FA28B]/20 flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2d4a2e] truncate">{title}</p>
        {subtitle && <p className="text-xs text-[#556B2F]/60 truncate">{subtitle}</p>}
        {children}
      </div>
      {trailing && <div className="flex-shrink-0">{trailing}</div>}
    </div>
  );
}
