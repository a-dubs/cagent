export interface AgentConfig {
  version: string
  agents: Record<string, Agent>
  models: Record<string, Model>
  metadata?: {
    readme?: string
  }
}

export interface Agent {
  model: string
  description: string
  instruction: string
  toolsets?: Toolset[]
  sub_agents?: string[]
  add_date?: boolean
}

export interface Model {
  provider: string
  model: string
  temperature?: number
  max_tokens?: number
  base_url?: string
}

export interface Toolset {
  type: string
  [key: string]: any
}

// Backend session shape (minimal fields we use)
export interface Session {
  id: string
  title?: string
  createdAt?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'tool' | 'system'
  // Content can be a single string or an array of items returned by the model.
  // When an array is received the UI should render each item on its own line.
  content: string | string[]
  timestamp: string
  toolCalls?: ToolCall[]
  // For tool call confirmations emitted by the server
  confirmation?: {
    tool_call: ToolCall
  }
  // For linking tool responses back to the originating call
  toolCallID?: string
  // For individual tool message rendering
  tool?: {
    name: string
    type?: string
    args?: string
  }
  toolOutput?: string
  // For think tool outputs: provide a short summary and full thoughts
  thinking?: {
    summary: string
    full: string
  }
  // Enhanced tool call tracking
  pendingTools?: PendingToolCall[]
  completedTools?: CompletedToolCall[]
}

export interface PendingToolCall {
  id: string
  name: string
  args?: string
  status: 'pending_approval' | 'approved' | 'executing'
  timestamp: string
}

export interface CompletedToolCall {
  id: string
  name: string
  args?: string
  output?: string
  thinking?: {
    summary: string
    full: string
  }
  timestamp: string
  duration?: number
}

export interface ToolCall {
  id: string
  type: string
  function: {
    name: string
    arguments: string
  }
}

export interface AppSettings {
  agentConfigPath: string
  workingDirectory: string
  environmentVariables: Record<string, string>
  theme: 'light' | 'dark' | 'system'
}