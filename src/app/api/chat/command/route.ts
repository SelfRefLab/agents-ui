import { NextRequest, NextResponse } from 'next/server';
import { redisClient } from '@/lib/redis';
import { CommandMessage } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { currentAgent, contextId, action, toolCallId } = await request.json();

    if (!contextId || !action) {
      return NextResponse.json(
        { error: 'Context ID and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be "accept" or "reject"' },
        { status: 400 }
      );
    }

    const commandMessage: CommandMessage = {
      event_type: "agent_command",
      context_id: contextId,
      data: {
        type: "resume",
        tool_call_id: toolCallId,
        payload: {
          type: action
        }
      }
    };

    // Send command to agent
    await redisClient.sendCommand(currentAgent, commandMessage);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending command:', error);
    return NextResponse.json(
      { error: 'Failed to send command' },
      { status: 500 }
    );
  }
}
