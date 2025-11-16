import { NextRequest, NextResponse } from 'next/server';
import { redisClient } from '@/lib/redis';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AgentCallMessage } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      );
    }

    const { message, contextId, targetAgent } = await request.json();

    if (!message || !contextId) {
      return NextResponse.json(
        { error: 'Message and contextId are required' },
        { status: 400 }
      );
    }

    // Check if this context belongs to the user, or create it if it's new
    let userContext = await prisma.userContext.findUnique({
      where: {
        contextId: contextId
      }
    });

    if (!userContext) {
      // Create new context for the user
      const title = message.length > 30 ? message.substring(0, 30) + '...' : message;
      userContext = await prisma.userContext.create({
        data: {
          userId: user.userId,
          contextId: contextId,
          title: title
        }
      });
    } else if (userContext.userId !== user.userId) {
      // Context exists but doesn't belong to this user
      return NextResponse.json(
        { error: 'No permission to access this session' },
        { status: 403 }
      );
    } else {
      // Update the context's updatedAt timestamp
      await prisma.userContext.update({
        where: {
          contextId: contextId
        },
        data: {
          updatedAt: new Date()
        }
      });
    }

    const callId = `call_${uuidv4()}`;
    const agentMessage: AgentCallMessage = {
      event_type: "agent_invocation",
      context_id: contextId,
      data: {
        caller_agent: "human",
        invocation_id: callId,
        task: message,
        context: {user_id: user.userId, user_name: user.username}
      }
    };

    // Send message to agent
    await redisClient.sendAgentMessage(agentMessage, targetAgent);

    return NextResponse.json({ success: true, callId });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
