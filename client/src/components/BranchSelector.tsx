import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface BranchSelectorProps {
  selectedBranchId: number | null;
  onBranchChange: (branchId: number) => void;
  managedBranches: { id: number; name: string }[];
  needsSelector: boolean;
  className?: string;
}

export default function BranchSelector({ selectedBranchId, onBranchChange, managedBranches, needsSelector, className }: BranchSelectorProps) {
  // Only show for area_manager/super_admin with branches
  if (!needsSelector || managedBranches.length <= 1) return null;

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
      <Select
        value={selectedBranchId ? String(selectedBranchId) : undefined}
        onValueChange={(val) => onBranchChange(Number(val))}
      >
        <SelectTrigger className="h-9 text-sm bg-white border-primary/20 w-full max-w-[200px]">
          <SelectValue placeholder="เลือกสาขา" />
        </SelectTrigger>
        <SelectContent>
          {managedBranches.map((b) => (
            <SelectItem key={b.id} value={String(b.id)}>
              {b.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
