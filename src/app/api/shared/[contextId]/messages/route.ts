import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { redisClient } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contextId: string }>  }
) {
  try {
    const { contextId } = await params;

    // First verify if this conversation is shared
    const userContext = await prisma.userContext.findUnique({
      where: { 
        contextId,
        isShared: true // Only allow access to shared conversations
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
      return NextResponse.json(
        { error: 'Shared conversation not found or not public' },
        { status: 404 }
      );
    }

    // Get chat messages from Redis
    let messages: any[] = [];
    try {
      // Use redisClient to get chat history
      messages = await redisClient.getChatHistory(contextId);
    } catch (redisError) {
      console.error('Error fetching from Redis:', redisError);
      // If Redis fails, return empty message array instead of error
      messages = [];
    }

    return NextResponse.json({
      success: true,
      messages,
      context: {
        title: userContext.title,
        username: userContext.user.username,
        sharedAt: userContext.sharedAt
      }
    });

  } catch (error) {
    console.error('Error fetching shared messages:', error);
    return NextResponse.json(
      { error: 'Failed to get shared messages' },
      { status: 500 }
    );
  }
}
