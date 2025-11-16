import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ contextId: string }>  }
) {
  try {
    const { contextId } = await params;
    const { isShared } = await request.json();

    // Find existing context
    const userContext = await prisma.userContext.findUnique({
      where: { contextId }
    });

    if (!userContext) {
      return NextResponse.json({ 
        success: false, 
        error: 'Context not found'
      }, { status: 404 });
    }

    // Update share status
    const updatedContext = await prisma.userContext.update({
      where: { contextId },
      data: {
        isShared,
        sharedAt: isShared ? new Date() : null
      }
    });

    return NextResponse.json({ 
      success: true, 
      isShared: updatedContext.isShared,
      shareUrl: updatedContext.isShared ? `/shared/${contextId}` : null,
      sharedAt: updatedContext.sharedAt
    });
  } catch (error) {
    console.error('Error sharing chat:', error);
    return NextResponse.json(
      { error: 'Failed to share chat' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contextId: string }>  }
) {
  try {
    const { contextId } = await params;

    // Find context share status
    const userContext = await prisma.userContext.findUnique({
      where: { contextId },
      select: {
        isShared: true,
        sharedAt: true
      }
    });

    if (!userContext) {
      return NextResponse.json({
        isShared: false,
        sharedAt: null,
        shareUrl: null
      });
    }

    return NextResponse.json({
      isShared: userContext.isShared,
      sharedAt: userContext.sharedAt,
      shareUrl: userContext.isShared ? `/shared/${contextId}` : null
    });
  } catch (error) {
    console.error('Error getting share status:', error);
    return NextResponse.json(
      { error: 'Failed to get share status' },
      { status: 500 }
    );
  }
}
