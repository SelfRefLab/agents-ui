// Agent message types based on the existing system
export interface AgentCallMessage {
  event_type: "agent_invocation";
  context_id: string;
  data: {
    caller_agent: "human";
    invocation_id: string;
    task: string;
    context: any
  };
}

export interface CommandMessage {
  event_type: "agent_command";
  context_id: string;
  data: {
    type: "resume";
    tool_call_id?: string
    payload: {
      type: "accept" | "reject";
    };
  };
}

export interface AgentResponseData {
  type: "message" | "interrupt";
  caller_agent: string;
  callee_agent: string;
  message: any;
  progress?: {
    current_step: number;
    total_steps: number;
    description: string;
  };
}

export interface AgentResponse {
  event_type: "agent_progress";
  data: AgentResponseData;
}

// Chat UI types
export interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  agent?: string;
  type?: "message" | "interrupt" | "progress";
  langchainMessageType?: "ai"|"tool"|"human",
  interruptToolCallId?: string;
  progress?: {
    current_step: number;
    total_steps: number;
    description: string;
  };
}

export interface ChatSession {
  context_id: string;
  messages: ChatMessage[];
  isActive: boolean;
  isFinish: boolean,
  currentAgent?: string;
}

export interface ChatSessionSummary {
  contextId: string;
  title: string;
  lastMessage: string;
  lastUpdated: number;
  messageCount: number;
}

// User types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserContext {
  id: string;
  userId: string;
  contextId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  userId: string;
  username: string;
  email: string;
}

// Agent types
export interface AgentOption {
  id: string;
  name: string;
  displayName: string;
}

export const AVAILABLE_AGENTS: AgentOption[] = [
  {
    id: 'agent_demo',
    name: 'agent_demo',
    displayName: 'agent_demo'
  }
];
