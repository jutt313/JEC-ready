import React from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toReiwaFormat, fromReiwaFormat, isValidReiwaDate } from '@/lib/japanese-date';

interface JapaneseDatePickerProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const JapaneseDatePicker: React.FC<JapaneseDatePickerProps> = ({
  value,
  onChange,
  placeholder = "輸出日を選択 / Select export date",
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date && isValidReiwaDate(date)) {
      onChange(date);
      setIsOpen(false);
    } else if (!date) {
      onChange(undefined);
      setIsOpen(false);
    }
  };

  const formatDisplayDate = (date: Date) => {
    try {
      const reiwaFormat = toReiwaFormat(date);
      const westernFormat = format(date, 'yyyy/MM/dd');
      return `${reiwaFormat} (${westernFormat})`;
    } catch (error) {
      return format(date, 'yyyy/MM/dd');
    }
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? formatDisplayDate(value) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={(date) => !isValidReiwaDate(date) || date < new Date()}
            initialFocus
            className="p-3 pointer-events-auto"
          />
          <div className="p-3 border-t text-xs text-muted-foreground">
            <p>令和時代の日付のみ選択可能 / Only Reiwa era dates available</p>
            <p>今日以降の日付を選択してください / Please select today or future dates</p>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default JapaneseDatePicker;