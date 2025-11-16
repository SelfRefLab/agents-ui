import { NextRequest } from 'next/server';
import { redisClient } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contextId = searchParams.get('contextId');

  if (!contextId) {
    return new Response('Context ID is required', { status: 400 });
  }

  const consumerId = uuidv4();
  console.log(`Starting SSE stream for context: ${contextId}, consumer: ${consumerId}`);

  // Create a readable stream for Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      let intervalId: NodeJS.Timeout | null = null;
      let isClosed = false;
      let heartbeatId: NodeJS.Timeout | null = null;

      const cleanup = () => {
        console.log(`Cleaning up SSE stream for context: ${contextId}`);
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        if (heartbeatId) {
          clearInterval(heartbeatId);
          heartbeatId = null;
        }
        if (!isClosed) {
          isClosed = true;
          try {
            controller.close();
          } catch (e) {
            // Controller might already be closed
            console.log('Controller already closed during cleanup');
          }
        }
      };

      const sendMessage = (data: any) => {
        if (isClosed) return false;
        try {
          controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
          return true;
        } catch (error) {
          console.log('Failed to send message, controller closed');
          cleanup();
          return false;
        }
      };

      try {
        // Create consumer group
        // console.log("createConsumerGroup start")
        // await redisClient.createConsumerGroup(contextId);
        // console.log("createConsumerGroup end")

        // Send initial connection message
        if (!sendMessage({ type: 'connected', contextId, consumerId })) {
          return;
        }

        await redisClient.subscribeMessages(contextId, (msg) => {
          sendMessage(msg);
        });

        // Send heartbeat every 30 seconds to keep connection alive
        heartbeatId = setInterval(() => {
          if (!sendMessage({ type: 'heartbeat', timestamp: Date.now() })) {
            cleanup();
          }
        }, 30000);

        // Start polling for messages
        const pollMessages = async () => {
          if (isClosed) return;
          
          try {
              
            // const messages = await redisClient.readMessages(contextId, consumerId);
            // for (const message of messages) {
            //   if (isClosed) break;
              
            //   if (message.data) {
            //     if (!sendMessage(message)) {
            //       return; // Stop polling if controller is closed
            //     }
            //   }
            // }
          } catch (error) {
            if (isClosed) return;
            
            console.error('Error polling messages:', error);
            if (!sendMessage({ 
              type: 'error', 
              message: 'Error reading messages',
              error: error instanceof Error ? error.message : 'Unknown error'
            })) {
              cleanup();
            }
          }
        };

        // Poll every 1 second
        intervalId = setInterval(pollMessages, 1000);

        // Clean up on client disconnect
        request.signal.addEventListener('abort', () => {
          console.log(`Client disconnected for context: ${contextId}`);
          cleanup();
        });

      } catch (error) {
        console.error('Error setting up stream:', error);
        sendMessage({ 
          type: 'error', 
          message: 'Failed to setup stream',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        cleanup();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}
