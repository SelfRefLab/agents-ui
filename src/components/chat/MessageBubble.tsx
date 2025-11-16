
import { useState } from 'react';
import { ChatMessage } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import MarkdownRenderer from '@/components/ui/markdown-render';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, User, Bot, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react'; // Added icons
import { useEffect,useRef } from 'react';
interface MessageBubbleProps {
  message: ChatMessage;
  onInterruptResponse?: (action: 'accept' | 'reject', toolCallId: string | undefined) => void;
}

export function MessageBubble({ message, onInterruptResponse }: MessageBubbleProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedAction, setProcessedAction] = useState<'accept' | 'reject' | null>(null);

  const [isCollapsed, setIsCollapsed] = useState(
    message.langchainMessageType === 'tool'
  );

    // Diagnostic log: print isCollapsed state during rendering
  console.log(
    `[Render State] ID: ${message.id}, langchainMessageType:${message.langchainMessageType} isCollapsed: ${isCollapsed}`
  );

  const isUser = message.sender === 'user';
  const isInterrupt = message.type === 'interrupt';
  const isProgress = message.type === 'progress';
  const interruptToolCallId = message.interruptToolCallId
  

  // useEffect(() => {
  //     setIsCollapsed(message.langchainMessageType === 'tool');
  // }, [message.langchainMessageType]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.content);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleInterruptResponse = async (action: 'accept' | 'reject', toolCallId: string | undefined) => {
    if (isProcessing || !onInterruptResponse) return;
    
    setIsProcessing(true);
    setProcessedAction(action);
    
    try {
      await onInterruptResponse(action, toolCallId);
    } catch (error) {
      console.error('Error handling interrupt response:', error);
      setIsProcessing(false);
      setProcessedAction(null);
    }
  };

  return (
    <div className={cn(
      "flex gap-4 group",
      isUser ? "justify-end" : "justify-start"
    )}>
      {!isUser && (
        <Avatar className="w-10 h-10 mt-1 flex-shrink-0">
          <AvatarFallback className="bg-primary to-indigo-600 text-white">
            <Bot size={24} />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-[75%] space-y-2",
        isUser && "order-first"
      )}>
        {!isUser && message.agent && (
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs font-medium px-2 py-1">
              {message.agent}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
        )}

        <div className={cn(
          "relative group/message rounded-2xl px-4 py-3 shadow-sm",
          isUser 
            ? "bg-primary text-primary-foreground ml-8" 
            : "bg-card border border-border",
          isInterrupt && "border-orange-400 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-600",
          isProgress && "border-blue-400 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-600"
        )}>
          {isProgress && message.progress && (
            <div className="mb-3 p-3 bg-blue-100 rounded-lg">
              <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Processing Progress</span>
                <span>{message.progress.current_step}/{message.progress.total_steps}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${(message.progress.current_step / message.progress.total_steps) * 100}%` 
                  }}
                />
              </div>
              <p className="text-sm text-blue-700">
                {message.progress.description}
              </p>
            </div>
          )}

          {/* Message content with collapse */}
          <div className={cn(
            "break-words leading-relaxed relative",
            isUser ? "text-primary-foreground" : "text-card-foreground",
            isCollapsed ? "max-h-40 overflow-hidden" : "",
            "pt-6"
          )}>
            {!isUser?
            <MarkdownRenderer content={message.content} className='text-base'></MarkdownRenderer>:message.content}
            {isCollapsed && (
              <div className={cn(
                "absolute bottom-0 left-0 w-full h-8",
                isUser 
                  ? "bg-gradient-to-t from-primary to-transparent"
                  : "bg-gradient-to-t from-card to-transparent"
              )} />
            )}
          </div>

          {/* Button area */}
          <div className="absolute top-2 right-2 flex gap-1">
            {/* Collapse button */}
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0",
                isUser 
                  ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </Button>

            {/* Copy button */}
            {/* <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-8 w-8 p-0",
                isUser 
                  ? "text-white/70 hover:text-white hover:bg-white/20" 
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              )}
              onClick={copyToClipboard}
            >
              <Copy size={14} />
            </Button> */}
          </div>

          {isInterrupt && onInterruptResponse && (
            <div className="flex gap-3 mt-4 pt-3 border-t border-orange-200">
              {isProcessing ? (
                <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
                  <span>
                    {processedAction === 'accept' ? 'Executing operation...' : 'Cancelling operation...'}
                  </span>
                </div>
              ) : (
                <>
                  <Button
                    size="sm"
                    onClick={() => handleInterruptResponse('accept',interruptToolCallId)}
                    className="bg-green-500 hover:bg-green-600 text-white rounded-lg px-4"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInterruptResponse('reject',interruptToolCallId)}
                    className="border-red-300 text-red-600 hover:bg-red-50 rounded-lg px-4"
                  >
                    <XCircle size={16} className="mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {isUser && (
          <div className="text-right mr-8">
            <span className="text-xs text-muted-foreground">
              {formatTimestamp(message.timestamp)}
            </span>
          </div>
        )}
      </div>

      {isUser && (
        <Avatar className="w-10 h-10 mt-1 flex-shrink-0">
          <AvatarFallback className="bg-gradient-to-r from-gray-500 to-gray-600 text-white">
            <User size={18} />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
