import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  agent?: string;
}

export function TypingIndicator({ agent }: TypingIndicatorProps) {
  return (
    <div className="flex gap-4 justify-start">
      <Avatar className="w-10 h-10 mt-1 flex-shrink-0">
        <AvatarFallback className="bg-primary text-white">
          <Bot size={18} />
        </AvatarFallback>
      </Avatar>
      
      <div className="max-w-[75%] space-y-2">
        {agent && (
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
              {agent}
            </Badge>
            <span className="text-xs text-gray-500">
              Processing...
            </span>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
            </div>
            <span className="text-sm text-gray-600">
              AI is thinking...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
