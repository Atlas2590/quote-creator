import { QuoteStatus, STATUS_CONFIG } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface QuoteStatusSelectProps {
  value: QuoteStatus;
  onValueChange: (value: QuoteStatus) => void;
  disabled?: boolean;
}

const statuses: QuoteStatus[] = [
  'bozza',
  'da_controllare',
  'da_confermare',
  'inviato',
  'accettato',
  'rifiutato',
  'annullato',
];

export function QuoteStatusSelect({ value, onValueChange, disabled }: QuoteStatusSelectProps) {
  const currentConfig = STATUS_CONFIG[value];
  
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
            currentConfig.bgClass
          )}>
            {currentConfig.label}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => {
          const config = STATUS_CONFIG[status];
          return (
            <SelectItem key={status} value={status}>
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                config.bgClass
              )}>
                {config.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
