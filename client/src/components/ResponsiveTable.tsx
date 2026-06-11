import { ReactNode, useState } from "react";
import { useIsMobile } from "@/hooks/useMobile";
import { MobileDataCard, MobileDataList } from "./MobileDataCard";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────
export interface Column<T> {
  key: string;
  header: string;
  /** Render cell content */
  render: (row: T, index: number) => ReactNode;
  /** If true, this column is shown in the mobile summary (always visible) */
  mobileSummary?: boolean;
  /** If true, this column is highlighted on mobile */
  mobileHighlight?: boolean;
  /** Hide this column on mobile entirely */
  mobileHidden?: boolean;
  /** Alignment */
  align?: "left" | "center" | "right";
  /** Width class for desktop */
  width?: string;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  /** Key extractor for each row */
  keyExtractor: (row: T, index: number) => string | number;
  /** Mobile card title */
  mobileTitle?: (row: T) => ReactNode;
  /** Mobile card subtitle */
  mobileSubtitle?: (row: T) => ReactNode;
  /** Mobile card icon */
  mobileIcon?: (row: T) => ReactNode;
  /** Mobile card badge */
  mobileBadge?: (row: T) => ReactNode;
  /** Mobile card actions */
  mobileActions?: (row: T) => ReactNode;
  /** Click handler for mobile card */
  onRowClick?: (row: T) => void;
  /** Empty state */
  emptyIcon?: ReactNode;
  emptyText?: string;
  /** Loading state */
  isLoading?: boolean;
  /** Additional class for the container */
  className?: string;
  /** Desktop table class */
  tableClassName?: string;
  /** Whether to show row numbers */
  showRowNumbers?: boolean;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  mobileTitle,
  mobileSubtitle,
  mobileIcon,
  mobileBadge,
  mobileActions,
  onRowClick,
  emptyIcon,
  emptyText = "ไม่มีข้อมูล",
  isLoading,
  className,
  tableClassName,
  showRowNumbers,
}: ResponsiveTableProps<T>) {
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl bg-muted/30 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        {emptyIcon && (
          <div className="mx-auto mb-2 text-muted-foreground/30">
            {emptyIcon}
          </div>
        )}
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      </div>
    );
  }

  // ─── Mobile View ─────────────────────────────────────────────
  if (isMobile) {
    return (
      <MobileDataList className={className}>
        {data.map((row, index) => {
          const summaryColumns = columns.filter(
            (c) => c.mobileSummary && !c.mobileHidden
          );
          const detailColumns = columns.filter(
            (c) => !c.mobileSummary && !c.mobileHidden
          );

          return (
            <MobileDataCard
              key={keyExtractor(row, index)}
              title={
                mobileTitle
                  ? mobileTitle(row)
                  : showRowNumbers
                    ? `#${index + 1}`
                    : ""
              }
              subtitle={mobileSubtitle?.(row)}
              icon={mobileIcon?.(row)}
              badge={mobileBadge?.(row)}
              summaryFields={summaryColumns.map((col) => ({
                label: col.header,
                value: col.render(row, index),
                highlight: col.mobileHighlight,
              }))}
              detailFields={detailColumns.map((col) => ({
                label: col.header,
                value: col.render(row, index),
                highlight: col.mobileHighlight,
              }))}
              actions={mobileActions?.(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            />
          );
        })}
      </MobileDataList>
    );
  }

  // ─── Desktop View ────────────────────────────────────────────
  return (
    <div className={cn("overflow-x-auto rounded-xl", className)}>
      <table
        className={cn(
          "w-full text-sm border-collapse",
          tableClassName
        )}
      >
        <thead>
          <tr className="border-b border-border/50 bg-muted/30">
            {showRowNumbers && (
              <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-10">
                #
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-3 py-2.5 text-xs font-medium text-muted-foreground",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  !col.align && "text-left",
                  col.width
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={keyExtractor(row, index)}
              className={cn(
                "border-b border-border/20 hover:bg-muted/20 transition-colors",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(row)}
            >
              {showRowNumbers && (
                <td className="px-3 py-2.5 text-xs text-muted-foreground">
                  {index + 1}
                </td>
              )}
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-3 py-2.5",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.width
                  )}
                >
                  {col.render(row, index)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Export Action Bar ──────────────────────────────────────────
interface ExportAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}

interface ExportBarProps {
  actions: ExportAction[];
  /** Show back button on mobile after export */
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

export function ExportBar({
  actions,
  onBack,
  backLabel = "กลับหน้าหลัก",
  className,
}: ExportBarProps) {
  const isMobile = useIsMobile();
  const [showExports, setShowExports] = useState(!isMobile);

  if (isMobile) {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Toggle button for mobile */}
        <button
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-border/40 shadow-sm"
          onClick={() => setShowExports(!showExports)}
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-[#6B7A3D]" />
            ส่งออกรายงาน
          </div>
          {showExports ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showExports && (
          <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2 duration-200">
            {actions.map((action, i) => (
              <button
                key={i}
                className={cn(
                  "flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium",
                  "bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-border/40",
                  "shadow-sm hover:shadow-md active:scale-[0.97] transition-all",
                  action.disabled && "opacity-50 pointer-events-none"
                )}
                onClick={action.onClick}
                disabled={action.disabled || action.loading}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Back button after export on mobile */}
        {onBack && (
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-[#6B7A3D] to-[#8B9A5C] text-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all mt-2"
            onClick={onBack}
          >
            {backLabel}
          </button>
        )}
      </div>
    );
  }

  // Desktop: inline buttons
  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {actions.map((action, i) => (
        <button
          key={i}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium",
            "border border-border/50 hover:bg-muted/50 transition-colors",
            action.disabled && "opacity-50 pointer-events-none"
          )}
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </div>
  );
}
