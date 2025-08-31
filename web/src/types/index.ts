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

// Backend session shape (matches sessionsResponse from server)
export interface Session {
  id: string
  title: string
  created_at: string
  num_messages: number
  input_tokens: number
  output_tokens: number
  most_recent_agent_filename: string
  // New fields for agent/environment separation
  agent_config_id?: string
  environment_setup_id?: number
  // For compatibility with existing code
  createdAt?: string
  updatedAt?: string
  agentName?: string
  // Frontend-only fields
  isFavorite?: boolean
}

// Backend session response with messages
export interface SessionResponse {
  id: string
  title: string
  messages: SessionMessage[]
  created_at: string
  updated_at?: string
  tools_approved: boolean
  input_tokens: number
  output_tokens: number
}

// Backend session message format
export interface SessionMessage {
  agentFilename: string
  agentName: string
  message: {
    role: 'user' | 'assistant' | 'tool' | 'system'
    content: string
    refusal?: string
    multi_content?: any[]
    name?: string
    reasoning_content?: string
    function_call?: {
      name: string
      arguments: string
    }
    tool_calls?: {
      index?: number
      id: string
      type: string
      function: {
        name: string
        arguments: string
      }
    }[]
    tool_call_id?: string
  }
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
  // UI-specific flag to indicate if this is a tool bubble
  isToolBubble?: boolean
  // UI-specific flag to indicate if this message contains both content and tools in a unified display
  isUnifiedMessage?: boolean
  // For merged shell tool calls
  shellToolCall?: {
    id: string
    name: string
    command: string
    output?: string
    isError?: boolean
    status: 'pending' | 'executing' | 'completed' | 'error'
    timestamp: string
    duration?: number
  }
  // For think tool calls
  thinkToolCall?: {
    id: string
    name: string
    thought: string
    thinking: {
      summary: string
      full: string
    }
    status: 'pending' | 'executing' | 'completed'
    timestamp: string
    duration?: number
  }
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

// Environment Setup - defines working environment for agents
export interface EnvironmentSetup {
  id?: number
  name: string
  description: string
  working_directory: string
  environment_variables: Record<string, string>
  created_at?: string
  updated_at?: string
}

// Agent Configuration - defines the AI agent itself
export interface AgentConfiguration {
  id?: string
  name: string
  description: string
  config_filename: string
  model: string
  provider: string
  instruction: string
  toolsets: any[] // Array of toolset configurations from backend
  toolset_display?: string // Human-readable string for display
  temperature?: number
  max_tokens?: number
  created_at?: string
  updated_at?: string
}

// Legacy AgentSetup for backward compatibility (will be phased out)
export interface AgentSetup {
  id?: number
  name: string
  description: string
  agent_config_path: string
  working_directory: string
  environment_variables: Record<string, string>
  created_at?: string
  updated_at?: string
}

export interface CustomAgentPath {
  id?: number
  path: string
  name: string
  description: string
  added_at?: string
}

export interface DirectoryEntry {
  name: string
  path: string
}

export interface DirectoryBrowseResponse {
  path: string
  directories: DirectoryEntry[]
}