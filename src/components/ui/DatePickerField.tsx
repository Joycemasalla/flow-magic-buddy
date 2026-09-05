import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn, toLocalDateString } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DatePickerFieldProps {
  /** 'YYYY-MM-DD' */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

/** Campo de data padronizado do app: botão + popover com calendário (pt-BR). */
export function DatePickerField({ value, onChange, placeholder = 'Selecionar data', className }: DatePickerFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + 'T12:00:00') : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full h-12 px-4 flex items-center justify-between rounded-xl bg-muted/50 border border-border/40 text-sm transition-colors hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">
            {selected
              ? format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : placeholder}
          </span>
          <CalendarIcon className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 rounded-2xl z-[70]">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (d) onChange(toLocalDateString(d));
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
