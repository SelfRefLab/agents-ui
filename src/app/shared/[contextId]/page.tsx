import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { SharedChatView } from '@/components/chat/SharedChatView';

interface SharedChatPageProps {
  params: {
    contextId: string;
  };
}

async function getSharedChat(contextId: string) {
  try {
    const userContext = await prisma.userContext.findFirst({
      where: { 
        contextId,
        isShared: true
      },
      include: {
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (!userContext) {
      return null;
    }

    return userContext;
  } catch (error) {
    console.error('Error fetching shared chat:', error);
    return null;
  }
}

export default async function SharedChatPage({ params }: SharedChatPageProps) {
  const { contextId } = await params;
  const sharedChat = await getSharedChat(contextId);

  if (!sharedChat) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <SharedChatView 
        contextId={contextId}
        title={sharedChat.title}
        username={sharedChat.user.username}
        sharedAt={sharedChat.sharedAt}
      />
    </div>
  );
}

export async function generateMetadata({ params }: SharedChatPageProps) {
  const { contextId } = await params;
  const sharedChat = await getSharedChat(contextId);

  if (!sharedChat) {
    return {
      title: 'Shared conversation not found',
    };
  }

  return {
    title: `${sharedChat.title} - Shared Conversation`,
    description: `Conversation shared by ${sharedChat.user.username}`,
  };
}
