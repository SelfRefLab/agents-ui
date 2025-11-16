import { NextRequest, NextResponse } from 'next/server';
import { redisClient } from '@/lib/redis';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      );
    }

    // Get user's contexts from database
    const userContexts = await prisma.userContext.findMany({
      where: {
        userId: user.userId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });


    // Get session details from Redis for each context
    const sessions = [];
    for (const context of userContexts) {
      try {
        const streamKey = `agent_task:${context.contextId}`;
        const commandRedis = redisClient.getCommandRedis();
        const messageCount = await commandRedis.xlen(streamKey);
        
        // Get last message
        const lastMessages = await commandRedis.xrevrange(streamKey, '+', '-', 'COUNT', 1);
        let lastMessage = 'New conversation';
        
        if (lastMessages.length > 0) {
          const [, fields] = lastMessages[0];
          if (fields && fields.length >= 2) {
            try {
              const data = JSON.parse(fields[1] as string);
              lastMessage = redisClient.extractMessagePreview(data.data?.message) || 'New conversation';
            } catch (e) {
              // Ignore parse errors
            }
          }
        }

        sessions.push({
          contextId: context.contextId,
          title: context.title,
          lastMessage,
          lastUpdated: context.updatedAt.getTime(),
          messageCount
        });
      } catch (error) {
        console.error(`Error getting session details for ${context.contextId}:`, error);
        // Still include the session with basic info
        sessions.push({
          contextId: context.contextId,
          title: context.title,
          lastMessage: 'New conversation',
          lastUpdated: context.updatedAt.getTime(),
          messageCount: 0
        });
      }
    }

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat sessions' },
      { status: 500 }
    );
  }
}
