import { cn } from '@/lib/utils';
import { QuoteStatus, STATUS_CONFIG } from '@/types/database';
import { Badge } from '@/components/ui/badge';

interface QuoteStatusBadgeProps {
  status: QuoteStatus;
  className?: string;
}

export function QuoteStatusBadge({ status, className }: QuoteStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <Badge 
      variant="secondary"
      className={cn(config.bgClass, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  );
}
