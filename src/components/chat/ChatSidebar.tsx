'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, MessageSquare, LogOut, User, Menu, X,BotIcon } from 'lucide-react';
import { ChatSessionSummary, AuthUser } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function ChatSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const { data: sessions, error, mutate } = useSWR<ChatSessionSummary[]>('/api/chats', fetcher, {
    refreshInterval: 60000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const { data: userData } = useSWR<{ user: AuthUser }>('/api/auth/me', fetcher);

  const currentContextId = pathname?.split('/chat/')[1];

  const handleNewChat = () => {
    const newContextId = uuidv4();
    router.push(`/chat/${newContextId}`);
  };

  const handleSelectChat = (contextId: string) => {
    router.push(`/chat/${contextId}`);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-sidebar/90 backdrop-blur-sm border-r border-sidebar-border flex flex-col">
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="w-10 h-10 p-0 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <Menu size={18} />
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center space-y-3 p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="w-10 h-10 p-0 rounded-xl bg-sidebar-primary/10 hover:bg-sidebar-primary/20 text-sidebar-primary"
          >
            <Plus size={18} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-60 h-full bg-sidebar/90 backdrop-blur-sm border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center">
              <BotIcon size={24} className="text-gray" />
            </div>
            <h2 className="font-semibold text-sidebar-foreground">SelfRefLab</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="w-8 h-8 p-0 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X size={16} />
          </Button>
        </div>
        
        <Button
          onClick={handleNewChat}
          className="w-full text-white rounded-xl h-10"
        >
          <Plus size={16} className="mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full" style={{ width: '100%' }}>
          <div className="p-2 w-60" style={{ maxWidth: '240px' }}>
            {error && (
              <div className="p-4 text-center text-destructive text-sm">
                Failed to load chat history
              </div>
            )}
            
            {!sessions && !error && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                Loading...
              </div>
            )}
            
            {sessions && sessions.length === 0 && (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No chat history
              </div>
            )}
            
            {sessions && sessions.map((session: ChatSessionSummary) => (
              <div
                key={session.contextId}
                onClick={() => handleSelectChat(session.contextId)}
                className={`
                  p-3 rounded-xl cursor-pointer transition-all mb-2 group
                  ${currentContextId === session.contextId 
                    ? 'bg-sidebar-accent border border-sidebar-primary/20 shadow-sm' 
                    : 'hover:bg-sidebar-accent/50'
                  }
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sidebar-foreground text-sm truncate mb-1">
                      {session.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {session.lastMessage}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatTime(session.lastUpdated)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {session.messageCount} messages
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* User Info */}
      <div className="flex-shrink-0 p-4 border-t border-sidebar-border">
        {userData?.user && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
                <User size={16} className="text-sidebar-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userData.user.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {userData.user.email}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-8 h-8 p-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
