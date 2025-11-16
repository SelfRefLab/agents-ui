import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { v4 as uuidv4 } from 'uuid';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function extractMessageContent(message: any): string {
  // If it's a string, return it directly
  if (typeof message === 'string') {
    return message;
  }

  // If it has content property, use that
  if (message?.content) {
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (let toolCall of message.tool_calls) {
        message.content += `\n\nTool call: ${toolCall.function?.name || toolCall.name}\nArguments: ${JSON.stringify(toolCall.function?.arguments || toolCall.args, null, 2)}`;
      }
      return message.content
    } else {
      return message.content;
    }
  }

  // If it's an action request, format it nicely
  if (message?.action_request) {
    const action = message.action_request;
    return `Request action: ${action.action}\nArguments: ${JSON.stringify(action.args, null, 2)}`;
  }

  // For other objects, try to extract meaningful content
  if (typeof message === 'object') {
    // Look for common content fields
    const contentFields = ['content', 'message', 'text', 'response'];
    for (const field of contentFields) {
      if (message[field] && typeof message[field] === 'string') {
        return message[field];
      }
    }

    // If it's a tool call result, format it
    if (message.type === 'tool' && message.name) {
      return `Tool result: ${message.name}\n${message.content || 'Execution completed'}`;
    }

    // If it has tool_calls, format them
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (let toolCall of message.tool_calls) {
        message.content += `\n\nTool call: ${toolCall.function?.name || toolCall.name}\nArguments: ${JSON.stringify(toolCall.function?.arguments || toolCall.args, null, 2)}`;
      }
      return message.content
    }

    // Last resort: return formatted JSON but cleaner
    return JSON.stringify(message, null, 2);
  }

  return String(message);
};
