import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL as string;

// Create different connection instances
export const redisCommand = new Redis(REDIS_URL, {
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: false,
  connectTimeout: 5000,
  commandTimeout: 3000,
  name: 'command-connection' // Name connection for identification
});

export const redisBlocking = new Redis(REDIS_URL, {
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
  lazyConnect: false,
  connectTimeout: 5000,
  // Note: Don't set commandTimeout for blocking connections
  name: 'blocking-connection'
});

// Add a dedicated connection for subscriptions
export const redisSubscriber = new Redis(REDIS_URL, {
  enableReadyCheck: true,
  maxRetriesPerRequest: null,
  lazyConnect: false,
  connectTimeout: 5000,
  name: 'subscriber-connection'
});

export class RedisStreamClient {
  private commandRedis: Redis;
  private blockingRedis: Redis;
  private subscriberRedis: Redis;
  private createdGroups = new Set<string>();

  constructor() {
    this.commandRedis = redisCommand;
    this.blockingRedis = redisBlocking;
    this.subscriberRedis = redisSubscriber;
  }

  // Use commandRedis for non-blocking operations
  async sendAgentMessage(message: any, targetAgent: string = "entry_agent"): Promise<void> {
    await this.commandRedis.xadd(
      `agent_event:${targetAgent}`,
      "*",
      "data",
      JSON.stringify(message, null, 0)
    );
  }

  async sendCommand(currentAgent: string, message: any): Promise<void> {
    await this.commandRedis.xadd(
      `agent_event:${currentAgent}`,
      "*",
      "data",
      JSON.stringify(message, null, 0)
    );
  }

  async createConsumerGroup(contextId: string): Promise<void> {
    if (this.createdGroups.has(contextId)) {
      return;
    }

    const streamKey = `agent_task:${contextId}`;
    const consumerGroup = `consumer_group_${contextId}`;
    
    try {
      await this.commandRedis.xgroup(
        "CREATE",
        streamKey,
        consumerGroup,
        "0",
        "MKSTREAM"
      );
      this.createdGroups.add(contextId);
    } catch (error: any) {
      if (error.message.includes('BUSYGROUP')) {
        this.createdGroups.add(contextId);
      } else {
        console.error("Error creating consumer group:", error);
        throw error;
      }
    }
  }

  // Use dedicated blockingRedis for blocking operations
  async readMessages(contextId: string, consumerId: string): Promise<any[]> {
    const streamKey = `agent_task:${contextId}`;
    const consumerGroup = `consumer_group_${contextId}`;
    
    try {
      const messages = await this.blockingRedis.xreadgroup(
        "GROUP",
        consumerGroup,
        consumerId,
        "COUNT",
        10,
        "BLOCK",
        1000,
        "STREAMS",
        streamKey,
        ">"
      );

      return this.parseMessages(messages);
    } catch (error) {
      console.error("Error reading messages:", error);
      return [];
    }
  }


  async subscribeMessages(contextId: string, onMessage: (data: any) => void) {
    const channel = `agent_task:${contextId}`;
    await this.subscriberRedis.subscribe(channel);
    this.subscriberRedis.on('message', (ch, msg) => {
      if (ch === channel) {
        try {
          onMessage(JSON.parse(msg));
        } catch (e) {
          console.error('Failed to parse message', e);
        }
      }
    });
  }

  private parseMessages(messages: any): any[] {
    if (!messages || messages.length === 0) {
      return [];
    }

    const parsedMessages = [];
    for (const [stream, streamMessages] of messages as [string, [string, string[]][]][]) {
      for (const [messageId, fields] of streamMessages) {
        try {
          // Fix field index: fields[0] is key, fields[1] is value
          const data = JSON.parse(fields[1]);
          parsedMessages.push({
            id: messageId,
            ...data
          });
        } catch (parseError) {
          console.error("Error parsing message:", parseError);
        }
      }
    }
    return parsedMessages;
  }

  // Get all chat sessions
  async getAllChatSessions(): Promise<any[]> {
    try {
      const keys = await this.commandRedis.keys('agent_task:*');
      const sessions = [];
      
      for (const key of keys) {
        const contextId = key.replace('agent_task:', '');
        // Get last message as preview
        const lastMessages = await this.commandRedis.xrevrange(key, '+', '-', 'COUNT', 1);
        
        if (lastMessages.length > 0) {
          const [messageId, fields] = lastMessages[0];
          try {
            // Fix: fields is array, fields[1] contains JSON data
            if (fields && fields.length >= 2) {
              const data = JSON.parse(fields[1] as string);
              const messageContent = this.extractMessagePreview(data.data?.message);
              
              sessions.push({
                contextId,
                title: this.generateChatTitle(messageContent),
                lastMessage: messageContent,
                lastUpdated: this.parseRedisTimestamp(messageId),
                messageCount: await this.commandRedis.xlen(key)
              });
            }
          } catch (parseError) {
            console.error('Error parsing session data:', parseError, 'fields:', fields);
          }
        }
      }
      
      // Sort by last update time
      return sessions.sort((a, b) => b.lastUpdated - a.lastUpdated);
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      return [];
    }
  }

  // Get history messages for specific session
  async getChatHistory(contextId: string): Promise<any[]> {
    try {
      const streamKey = `agent_task:${contextId}`;
      const messages = await this.commandRedis.xrange(streamKey, '-', '+');
      
      return messages.map(([messageId, fields]) => {
        try {
          // Fix: fields is array, fields[1] contains JSON data
          if (fields && fields.length >= 2) {
            const data = JSON.parse(fields[1] as string);
            return {
              id: messageId,
              timestamp: this.parseRedisTimestamp(messageId),
              ...data.data // ContextProgressData
            };
          }
          return null;
        } catch (parseError) {
          console.error('Error parsing message:', parseError, 'fields:', fields);
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  // Helper method: extract preview text from message
  public extractMessagePreview(message: any): string {
    if (!message) return 'New conversation';
    
    if (typeof message === 'string') {
      return message.substring(0, 50) + (message.length > 50 ? '...' : '');
    }
    
    if (message.content) {
      const content = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
      return content.substring(0, 50) + (content.length > 50 ? '...' : '');
    }
    
    return 'New conversation';
  }

  // Public method: get Redis command client
  public getCommandRedis(): Redis {
    return this.commandRedis;
  }

  public getBlockingRedis(): Redis {
    return this.blockingRedis;
  }

  // Helper method: generate chat title
  private generateChatTitle(messageContent: string): string {
    if (!messageContent || messageContent === 'New conversation') {
      return 'New conversation';
    }
    
    // Take first 30 characters as title
    const title = messageContent.substring(0, 30);
    return title + (messageContent.length > 30 ? '...' : '');
  }

  // Helper method: parse timestamp from Redis Stream ID
  private parseRedisTimestamp(messageId: string): number {
    try {
      const [timestamp] = messageId.split('-');
      return parseInt(timestamp);
    } catch {
      return Date.now();
    }
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.commandRedis.disconnect(),
      this.blockingRedis.disconnect(),
      this.subscriberRedis.disconnect()
    ]);
  }
}

export const redisClient = new RedisStreamClient();
