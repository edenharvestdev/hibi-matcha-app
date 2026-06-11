import { useState, ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataField {
  label: string;
  value: ReactNode;
  highlight?: boolean;
  className?: string;
}

interface MobileDataCardProps {
  /** Primary title shown in the card header */
  title: ReactNode;
  /** Subtitle shown below the title */
  subtitle?: ReactNode;
  /** Badge/status shown on the right side of header */
  badge?: ReactNode;
  /** Icon shown on the left side of header */
  icon?: ReactNode;
  /** Fields always visible (summary) */
  summaryFields?: DataField[];
  /** Fields shown when expanded (details) */
  detailFields?: DataField[];
  /** Actions (buttons) shown at the bottom */
  actions?: ReactNode;
  /** Additional className for the card */
  className?: string;
  /** Whether the card starts expanded */
  defaultExpanded?: boolean;
  /** Click handler for the entire card */
  onClick?: () => void;
}

export function MobileDataCard({
  title,
  subtitle,
  badge,
  icon,
  summaryFields,
  detailFields,
  actions,
  className,
  defaultExpanded = false,
  onClick,
}: MobileDataCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasDetails = detailFields && detailFields.length > 0;

  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-white/60 dark:bg-white/5 backdrop-blur-sm",
        "shadow-sm hover:shadow-md transition-all duration-200",
        "overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3",
          (hasDetails || onClick) && "cursor-pointer active:bg-muted/30"
        )}
        onClick={() => {
          if (onClick) {
            onClick();
          } else if (hasDetails) {
            setExpanded(!expanded);
          }
        }}
      >
        {icon && (
          <div className="shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-[#6B7A3D]/10 to-[#8B9A5C]/10 flex items-center justify-center text-[#6B7A3D]">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{title}</div>
          {subtitle && (
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {subtitle}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {badge}
          {hasDetails && !onClick && (
            <div className="text-muted-foreground">
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Summary Fields */}
      {summaryFields && summaryFields.length > 0 && (
        <div className="px-4 pb-2 grid grid-cols-2 gap-x-4 gap-y-1">
          {summaryFields.map((field, i) => (
            <div key={i} className={cn("flex flex-col", field.className)}>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {field.label}
              </span>
              <span
                className={cn(
                  "text-sm",
                  field.highlight
                    ? "font-semibold text-[#4A5D23]"
                    : "text-foreground"
                )}
              >
                {field.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Detail Fields (expandable) */}
      {hasDetails && expanded && (
        <div className="px-4 pb-3 pt-1 border-t border-border/30 space-y-2 animate-in slide-in-from-top-2 duration-200">
          {detailFields.map((field, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center justify-between text-sm",
                field.className
              )}
            >
              <span className="text-muted-foreground text-xs">
                {field.label}
              </span>
              <span
                className={cn(
                  field.highlight
                    ? "font-semibold text-[#4A5D23]"
                    : "text-foreground"
                )}
              >
                {field.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {actions && (
        <div className="px-4 pb-3 pt-1 border-t border-border/30 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

/** Wrapper for a list of MobileDataCards with consistent spacing */
export function MobileDataList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>{children}</div>
  );
}
