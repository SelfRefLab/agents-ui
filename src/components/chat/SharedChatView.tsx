'use client';

import { useState, useEffect } from 'react';
import { MessageBubble } from './MessageBubble';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, Calendar, User, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/lib/types';
import {extractMessageContent} from "@/lib/utils"
import { v4 as uuidv4 } from 'uuid';

interface SharedChatViewProps {
  contextId: string;
  title: string;
  username: string;
  sharedAt: Date | null;
}

export function SharedChatView({ contextId, title, username, sharedAt }: SharedChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/shared/${contextId}/messages`);
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        const chatHistory = data.messages
        const convertedMessages = chatHistory.map((historyItem: any) => {
          // Convert history item to ChatMessage format
          const content = extractMessageContent(historyItem.message);
          return {
            id: historyItem.id || uuidv4(),
            content,
            langchainMessageType: historyItem.message.type,
            sender: historyItem.message.type=='human'?'user':'agent',
            timestamp: new Date(historyItem.timestamp),
            agent: historyItem.callee_agent || historyItem.caller_agent,
            type: historyItem.type || 'message',
            interruptToolCallId: historyItem.type=='interrupt'? historyItem.message.tool_call_id:undefined
          } as ChatMessage;
        }).filter((msg: ChatMessage) => msg.content && msg.content.trim() !== '');

        setMessages(convertedMessages || []);


        console.log(messages)
      } catch (err) {
        setError('Unable to load conversation content');
        console.error('Error fetching shared messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [contextId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              This shared link may have expired or the conversation does not exist
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Share2 className="h-5 w-5 text-primary" />
              <Badge variant="secondary" className="text-xs">
                Shared Conversation
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
          </div>
          
          <h1 className="text-xl font-semibold text-card-foreground mb-2">
            {title}
          </h1>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Shared by {username}</span>
            </div>
            {sharedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Shared on {new Date(sharedAt).toLocaleDateString('en-US')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-full max-w-7xl mx-auto">
          <div className="h-full  px-4 py-6">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No messages in this conversation</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/30 px-4 py-3 mt-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-muted-foreground text-center">
            This is a read-only shared conversation, you cannot send messages on this page
          </p>
        </div>
      </div>
    </div>
  );
}
