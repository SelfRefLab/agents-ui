'use client';

import { ChatInterface } from '@/components/chat/ChatInterface';
import { useTheme } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/ui/button';
import { ShareDialog } from '@/components/chat/ShareDialog';
import { DeleteConfirmDialog } from '@/components/chat/DeleteConfirmDialog';
import { Sun, Moon, Share2, Trash2, ChevronDown, Edit3, Github } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AVAILABLE_AGENTS, AgentOption } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface ChatPageProps {
  params: Promise<{
    contextId: string;
  }>;
}

// Internal component, ensure rendering after ThemeProvider is available
function ChatPageContent({ contextId }: { contextId: string }) {
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [selectedAgent, setSelectedAgent] = useState<AgentOption>(() => {
    // Initially try to restore from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedAgent');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed; // Directly return previously saved AgentOption
        } catch { }
      }
    }
    return AVAILABLE_AGENTS[0]; // Default
  });

  const onSelectAgent = (agent: AgentOption) => {
    setSelectedAgent(agent);
    localStorage.setItem('selectedAgent', JSON.stringify(agent));
  };

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customAgentName, setCustomAgentName] = useState('');
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleCustomAgentSubmit = () => {
    if (customAgentName.trim()) {
      const customAgent: AgentOption = {
        id: `custom_${customAgentName}`,
        name: customAgentName.trim(),
        displayName: `Custom: ${customAgentName.trim()}`
      };
      onSelectAgent(customAgent);
      setShowCustomInput(false);
      setCustomAgentName('');
      console.log('Selected custom agent:', customAgent);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCustomAgentSubmit();
    } else if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomAgentName('');
    }
  };

  const handleDelete = async () => {
    setShowDeleteDialog(false);

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
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 text-base font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                  <span>{selectedAgent.displayName}</span>
                  <ChevronDown size={14} className="text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {AVAILABLE_AGENTS.map((agent) => (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => {
                      console.log('Selecting agent:', agent);
                      onSelectAgent(agent);
                      setShowCustomInput(false);
                    }}
                    className={selectedAgent.id === agent.id ? 'bg-accent text-accent-foreground' : ''}
                  >
                    {agent.displayName}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                {showCustomInput ? (
                  <div className="p-2">
                    <div className="flex items-center space-x-2">
                      <Input
                        value={customAgentName}
                        onChange={(e) => setCustomAgentName(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Enter Agent name"
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={handleCustomAgentSubmit}
                        disabled={!customAgentName.trim()}
                        className="h-8 px-2"
                      >
                        Confirm
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Press Enter to confirm, Esc to cancel
                    </div>
                  </div>
                ) : (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault(); // Prevent closing
                      setShowCustomInput(true);
                      setCustomAgentName('');
                    }}
                  >
                    <Edit3 size={16} className="mr-2" />
                    Custom Agent
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="w-9 h-9 p-0 rounded-xl"
            >
              {theme === 'dark' ? (
                <Sun size={16} className="text-foreground" />
              ) : (
                <Moon size={16} className="text-foreground" />
              )}
            </Button>

            {/* Share Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareDialog(true)}
              className="w-9 h-9 p-0 rounded-xl"
            >
              <Share2 size={16} className="text-foreground" />
            </Button>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="w-9 h-9 p-0 rounded-xl text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={16} />
            </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.open("https://github.com/SelfRefLab/langgraph_distributed_agent", "_blank");
            }}
            className="w-9 h-9 p-0 rounded-xl"
          >
            <Github size={16} className="text-foreground" />
          </Button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-hidden">
        <ChatInterface contextId={contextId} selectedAgent={selectedAgent} />
      </main>

      {/* Dialogs */}
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        contextId={contextId}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
      />
    </div>
  );
}

export default function ChatPage({ params }: ChatPageProps) {
  const [contextId, setContextId] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then(({ contextId }) => {
      setContextId(contextId);
    });
  }, [params]);

  // Ensure component is mounted
  useEffect(() => {
    setMounted(true);
  }, []);

  // Loading state
  if (!contextId || !mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // Render main content
  return <ChatPageContent contextId={contextId} />;
}
