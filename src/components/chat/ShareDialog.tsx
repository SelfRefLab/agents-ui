'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareDialogProps {
  contextId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShareDialog({ contextId, open, onOpenChange }: ShareDialogProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isShared, setIsShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const response = await fetch(`/api/chats/${contextId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isShared: true }),
      });

      if (response.ok) {
        const baseUrl = window.location.origin;
        const url = `${baseUrl}/shared/${contextId}`;
        setShareUrl(url);
        setIsShared(true);
      } else {
        console.error('Failed to share chat');
      }
    } catch (error) {
      console.error('Error sharing chat:', error);
    } finally {
      setIsSharing(false);
    }
  };

  function fallbackCopyTextToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Avoid page scrolling
    textArea.style.position = 'fixed';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      console.log('Fallback: Copying text command was ' + successful);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  }

  const handleCopy = async () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy with Clipboard API:', error);
        fallbackCopyTextToClipboard(shareUrl);
      }
    } else {
      console.warn('Clipboard API not available, using fallback');
      fallbackCopyTextToClipboard(shareUrl);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(shareUrl, '_blank');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <Card className="relative w-full max-w-md mx-4 bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Share2 size={20} />
            Share Conversation
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isShared ? 'Conversation is shared, anyone can access it via the link' : 'Share this conversation for others to view'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!isShared ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  After sharing, anyone can view this conversation content via the link, but cannot edit or reply.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleShare}
                  disabled={isSharing}
                  className="flex-1"
                >
                  {isSharing ? 'Sharing...' : 'Create Share Link'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-card-foreground">
                  Share Link
                </label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1 bg-muted"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className={cn(
                      "px-3",
                      copied && "text-green-600"
                    )}
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleOpenInNewTab}
                  className="flex-1"
                >
                  <ExternalLink size={16} className="mr-2" />
                  Preview
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
