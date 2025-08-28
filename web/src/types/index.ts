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
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  toolCalls?: ToolCall[]
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