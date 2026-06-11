import { useState } from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerCEProps {
  /** Value as ISO date string YYYY-MM-DD */
  value: string;
  /** Callback with ISO date string YYYY-MM-DD */
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Disable dates after this date */
  maxDate?: Date;
  /** Disable dates before this date */
  minDate?: Date;
}

/**
 * Date picker that always displays in CE (Common Era / ค.ศ.)
 * Uses react-day-picker Calendar which renders in CE regardless of device locale.
 * This fixes the issue where iOS Safari shows Buddhist Era (พ.ศ.) dates.
 */
export default function DatePickerCE({
  value,
  onChange,
  placeholder = "เลือกวันที่",
  className,
  maxDate,
  minDate,
}: DatePickerCEProps) {
  const [open, setOpen] = useState(false);

  // Parse the ISO string to a Date object
  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  // Format for display: "4 Apr 2026" (always CE)
  const displayValue = selectedDate
    ? format(selectedDate, "d MMM yyyy")
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {displayValue || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={(date) => {
            if (maxDate && date > maxDate) return true;
            if (minDate && date < minDate) return true;
            return false;
          }}
          defaultMonth={selectedDate || new Date()}
          captionLayout="dropdown"
          fromYear={2024}
          toYear={new Date().getFullYear() + 1}
        />
      </PopoverContent>
    </Popover>
  );
}
