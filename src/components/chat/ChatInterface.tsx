'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, RefreshCw } from 'lucide-react';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatMessage, ChatSession } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import useSWR from 'swr';
import React from 'react';
import { extractMessageContent } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

import { AgentOption } from '@/lib/types';

// Optimized messages area component
const MessagesArea = React.memo(function MessagesArea({
  messages,
  isTyping,
  currentAgent,
  onInterruptResponse,
  messagesEndRef
}: {
  messages: ChatMessage[];
  isTyping: boolean;
  currentAgent?: string;
  onInterruptResponse: (action: 'accept' | 'reject', toolCallId: string | undefined) => Promise<void>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="h-full">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {messages.length === 0 && <EmptyState />}
          
          <div className="space-y-4">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onInterruptResponse={onInterruptResponse}
              />
            ))}
            
            {isTyping && (
              <TypingIndicator agent={currentAgent} />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
});

// Empty state component
const EmptyState = React.memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-96 text-center">
      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        Start a new conversation
      </h3>
      <p className="text-muted-foreground max-w-md">
        I am an intelligent assistant based on Langgraph Distributed Agent
      </p>
    </div>
  );
});

// Optimized input area component
const InputArea = React.memo(function InputArea({
  inputMessage,
  onInputChange,
  onClearInput,
  onSendMessage,
  onKeyPress,
  isLoading,
  isFinish,
  currentAgent
}: {
  inputMessage: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearInput: () => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  isFinish: boolean;
  currentAgent?: string;
}) {
  return (
    <div className="flex-shrink-0 bg-background/95 backdrop-blur-sm border-t border-border p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Input
              value={inputMessage}
              onChange={onInputChange}
              onKeyPress={onKeyPress}
              placeholder={!isFinish ? `${currentAgent} is processing...` : "Enter your question or request..."}
              disabled={isLoading}
              className="pr-12 h-11 text-base bg-input border-border focus:border-primary focus:ring-primary rounded-xl resize-none"
            />
            {inputMessage && (
              <button
                onClick={onClearInput}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <Button
            onClick={onSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="h-11 px-6 bg-primary  rounded-xl"
          >
            {isLoading ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </Button>
        </div>
        
        {!isFinish && (
          <div className="flex items-center justify-center mt-2">
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span>{currentAgent} is processing</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export function ChatInterface({ contextId, selectedAgent }: { contextId?: string; selectedAgent?: AgentOption }) {
  const actualContextId = contextId || uuidv4();
  
  // Debug log
  useEffect(() => {
    console.log('ChatInterface received selectedAgent:', selectedAgent);
  }, [selectedAgent]);
  
  const [session, setSession] = useState<ChatSession>({
    context_id: actualContextId,
    messages: [],
    isActive: false,
    isFinish: true,
    currentAgent: undefined
  });
  
  // Load chat history if contextId is provided
  const { data: chatHistory, error } = useSWR(
    contextId ? `/api/chats/${contextId}` : null,
    fetcher
  );

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Optimized input handler function
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  }, []);

  const handleClearInput = useCallback(() => {
    setInputMessage('');
  }, []);

  // Optimized scroll function
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Debounced scroll
  const debouncedScrollToBottom = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(scrollToBottom, 100);
    };
  }, [scrollToBottom]);

  // Optimized scroll trigger - only scroll when message count changes
  useEffect(() => {
    debouncedScrollToBottom();
  }, [session.messages.length, isTyping, debouncedScrollToBottom]);

  // Load chat history when available
  useEffect(() => {
    if (chatHistory && !historyLoaded && contextId) {
      // Check if chatHistory is an array
      if (Array.isArray(chatHistory)) {
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

        // @lanxuanli
        let lastAgentName: string | undefined;
        if (convertedMessages.length > 0) {
            const lastMsg = convertedMessages[convertedMessages.length - 1];
            if (lastMsg.sender === 'agent') {
                lastAgentName = lastMsg.agent;
            }
        }

        setSession(prev => ({
          ...prev,
          context_id: contextId,
          messages: convertedMessages,
          currentAgent: lastAgentName
        }));
      } else {
        console.log('Chat history is not an array:', chatHistory);
        // Set empty messages if history is not an array
        setSession(prev => ({
          ...prev,
          context_id: contextId,
          messages: []
        }));
      }
      setHistoryLoaded(true);
    }
  }, [chatHistory, historyLoaded, contextId]);

  // Update context_id when contextId prop changes
  useEffect(() => {
    if (contextId && session.context_id !== contextId) {
      setSession(prev => ({
        ...prev,
        context_id: contextId,
        messages: [],
        isActive: false,
        currentAgent: undefined
      }));
      setHistoryLoaded(false);
    }
  }, [contextId, session.context_id]);

  // Initialize SSE connection
  useEffect(() => {
    let currentEventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    
    const connectSSE = () => {
      // Close existing connection if any
      if (currentEventSource) {
        currentEventSource.close();
      }
      
      console.log('Connecting to SSE stream...');
      currentEventSource = new EventSource(`/api/chat/stream?contextId=${session.context_id}`);
      
      currentEventSource.onopen = () => {
        console.log('SSE connection opened');
        setSession(prev => ({ ...prev, isActive: true }));
        setEventSource(currentEventSource);
      };

      currentEventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleAgentMessage(data);
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };

      currentEventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setSession(prev => ({ ...prev, isActive: false }));
        setIsTyping(false);
        
        // Clear the event source reference
        setEventSource(null);
        
        // Only attempt reconnection if the connection was closed unexpectedly
        if (currentEventSource && currentEventSource.readyState === EventSource.CLOSED) {
          console.log('Attempting to reconnect in 3 seconds...');
          reconnectTimeout = setTimeout(() => {
            connectSSE();
          }, 3000);
        }
      };
    };

    // Initial connection
    connectSSE();

    // Cleanup function
    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (currentEventSource) {
        currentEventSource.close();
        currentEventSource = null;
      }
      setEventSource(null);
    };
  }, [session.context_id]);

  const handleAgentMessage = useCallback((data: any) => {
    console.log("handleAgentMessage", data);
    if (data.type === 'connected') {
      console.log('Connected to agent stream');
      return;
    }

    if (data.type === 'error') {
      console.error('Agent error:', data.message);
      return;
    }

    // Handle agent responses
    if (data.data) {
      const messageData = data.data;
            
      setIsTyping(false);

      if (messageData.type === 'message') {

        // Check if this is a finish event - just update state but don't show message
        if (messageData.is_finish) {
          console.log("Finished.")
          setSession(prev => ({
            ...prev,
            isFinish: true,
            currentAgent: undefined // Clear current agent when finished
          }));
        }

        const content = extractMessageContent(messageData.message);
        
        // Skip empty or meaningless messages
        if (!content || content.trim() === '' || content === 'null' || content === 'undefined') {
          return;
        }

        const newMessage: ChatMessage = {
          id: uuidv4(),
          content,
          sender: 'agent',
          langchainMessageType: messageData.message.type,
          timestamp: new Date(),
          agent: messageData.callee_agent || 'Agent',
          type: 'message'
        };

        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, newMessage],
          isFinish: messageData.is_finish,
          currentAgent: messageData.callee_agent
        }));
      } else if (messageData.type === 'interrupt') {
        const content = extractMessageContent(messageData.message);
        const interruptMessage: ChatMessage = {
          id: uuidv4(),
          content,
          sender: 'agent',
          timestamp: new Date(),
          agent: messageData.callee_agent || 'Agent',
          type: 'interrupt',
          interruptToolCallId: messageData.message.tool_call_id
        };

        setSession(prev => ({
          ...prev,
          messages: [...prev.messages, interruptMessage],
          currentAgent: messageData.callee_agent
        }));
      }
    }
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    const messageToSend = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          contextId: session.context_id,
          targetAgent: selectedAgent?.name || 'entry_agent'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const result = await response.json();
      console.log('Message sent:', result);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      // Add error message
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        content: 'Failed to send message, please try again.',
        sender: 'agent',
        timestamp: new Date(),
        type: 'message'
      };

      setSession(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, session.context_id, selectedAgent?.name]);

  const handleInterruptResponse = useCallback(async (action: 'accept' | 'reject', toolCallId: string | undefined) => {
    try {
      const response = await fetch('/api/chat/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentAgent: session.currentAgent,
          contextId: session.context_id,
          toolCallId: toolCallId,
          action
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send command');
      }

      console.log(`Interrupt ${action}ed`);
    } catch (error) {
      console.error('Error sending interrupt response:', error);
    }
  }, [session.currentAgent, session.context_id]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }, [sendMessage]);

  const router = useRouter();

  const handleDelete = async () => {
    if (!contextId) return;
    
    try {
      const response = await fetch(`/api/chats/${contextId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Delete failed');
      }

      // Navigate back to new chat after successful deletion
      router.push('/chat');
    } catch (error) {
      console.error('Error deleting chat:', error);
      // You might want to show a toast notification here
      alert('Failed to delete conversation, please try again');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Messages Area */}
      <MessagesArea
        messages={session.messages}
        isTyping={isTyping}
        currentAgent={session.currentAgent}
        onInterruptResponse={handleInterruptResponse}
        //@ts-ignore
        messagesEndRef={messagesEndRef}
      />

      {/* Input Area */}
      <InputArea
        inputMessage={inputMessage}
        onInputChange={handleInputChange}
        onClearInput={handleClearInput}
        onSendMessage={sendMessage}
        onKeyPress={handleKeyPress}
        isLoading={isLoading}
        isFinish={session.isFinish}
        currentAgent={session.currentAgent}
      />
    </div>
  );
}
