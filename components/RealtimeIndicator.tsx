import { Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RealtimeIndicatorProps {
  isConnected: boolean;
}

export function RealtimeIndicator({ isConnected }: RealtimeIndicatorProps) {
  return (
    <Badge 
      variant={isConnected ? 'default' : 'secondary'}
      className="flex items-center gap-1.5"
    >
      <Activity className={`h-3 w-3 ${isConnected ? 'animate-pulse' : ''}`} />
      {isConnected ? 'Live' : 'Offline'}
    </Badge>
  );
}
