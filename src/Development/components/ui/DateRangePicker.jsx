import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from './button.js';
import { Popover, PopoverContent, PopoverTrigger } from './popover.js';
import { Calendar as CalendarComponent } from './calendar.js';
import { cn } from '../../lib/utils.js';

const DatePickerWithRange = ({ date, onDateChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range) => {
    if (range?.from) {
      if (range?.to) {
        onDateChange(range);
        setIsOpen(false);
      } else {
        onDateChange({ from: range.from, to: null });
      }
    } else {
      onDateChange({ from: null, to: null });
    }
  };

  const formatDateDDMMYYYY = (d) => {
    if (!d) return "";
    const dateObj = d instanceof Date ? d : new Date(d);
    if (isNaN(dateObj.getTime())) return "";
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date?.from && "text-muted-foreground"
            )}
          >
            <Calendar className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {formatDateDDMMYYYY(date.from)} - {formatDateDDMMYYYY(date.to)}
                </>
              ) : (
                formatDateDDMMYYYY(date.from)
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export { DatePickerWithRange };