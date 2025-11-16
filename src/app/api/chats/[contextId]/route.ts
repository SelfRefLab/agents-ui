import { NextRequest, NextResponse } from 'next/server';
import { redisClient } from '@/lib/redis';
import { getUserFromRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contextId: string }>  }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      );
    }

    const { contextId } = await params;
    
    if (!contextId) {
      return NextResponse.json(
        { error: 'Context ID is required' },
        { status: 400 }
      );
    }

    // Check if this context belongs to the user
    const userContext = await prisma.userContext.findUnique({
      where: {
        contextId: contextId
      }
    });

    if (!userContext || userContext.userId !== user.userId) {
      return NextResponse.json(
        { error: 'No permission to access this session' },
        { status: 403 }
      );
    }

    const history = await redisClient.getChatHistory(contextId);
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ contextId: string }>  }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Not logged in' },
        { status: 401 }
      );
    }

    const { contextId } = await params;
    
    if (!contextId) {
      return NextResponse.json(
        { error: 'Context ID is required' },
        { status: 400 }
      );
    }

    // Check if this context belongs to the user
    const userContext = await prisma.userContext.findUnique({
      where: {
        contextId: contextId
      }
    });

    if (!userContext || userContext.userId !== user.userId) {
      return NextResponse.json(
        { error: 'No permission to delete this session' },
        { status: 403 }
      );
    }

    // Delete the context from database
    await prisma.userContext.delete({
      where: {
        contextId: contextId
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Conversation deleted'
    });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Failed to delete chat' },
      { status: 500 }
    );
  }
}
