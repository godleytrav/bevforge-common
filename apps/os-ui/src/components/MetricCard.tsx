import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: {
    value: number;
    label: string;
  };
  icon?: LucideIcon;
  status?: 'operational' | 'warning' | 'error' | 'info';
  className?: string;
}

const statusStyles = {
  operational: 'border-green-500 text-green-600',
  warning: 'border-yellow-500 text-yellow-600',
  error: 'border-destructive text-destructive',
  info: 'border-blue-500 text-blue-600',
};

export default function MetricCard({
  title,
  value,
  unit,
  change,
  icon: Icon,
  status = 'info',
  className = '',
}: MetricCardProps) {
  return (
    <Card className={`${className} border-l-4 ${statusStyles[status]} transition-shadow hover:shadow-glow-lg`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {Icon && <Icon className={`h-4 w-4 ${statusStyles[status]}`} />}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold font-mono">{value}</div>
          {unit && <div className="text-sm text-muted-foreground">{unit}</div>}
        </div>
        {change && (
          <p className="text-xs text-muted-foreground mt-1">
            <span
              className={`font-medium ${
                change.value > 0
                  ? 'text-secondary'
                  : change.value < 0
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }`}
            >
              {change.value > 0 ? '+' : ''}
              {change.value}%
            </span>{' '}
            {change.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
