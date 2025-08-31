import { AgentSetup, CustomAgentPath, DirectoryBrowseResponse, Session, SessionResponse, AgentConfiguration, EnvironmentSetup } from '@/types'

const API_BASE = '/api'

export class ApiClient {
  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  }

  async streamPost(endpoint: string, data?: any): Promise<ReadableStream> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: data ? JSON.stringify(data) : undefined,
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.body!
  }
}

export const apiClient = new ApiClient()

// Agent setup API functions
export const agentSetupApi = {
  getAgentSetups: () => apiClient.get<AgentSetup[]>('/agent-setups'),
  getAgentSetup: (id: number) => apiClient.get<AgentSetup>(`/agent-setups/${id}`),
  createAgentSetup: (setup: AgentSetup) => apiClient.post<AgentSetup>('/agent-setups', setup),
  updateAgentSetup: (id: number, setup: AgentSetup) => apiClient.put<AgentSetup>(`/agent-setups/${id}`, setup),
  deleteAgentSetup: (id: number) => apiClient.delete(`/agent-setups/${id}`),
}

// Custom agent paths API functions
export const customAgentPathApi = {
  getCustomAgentPaths: () => apiClient.get<CustomAgentPath[]>('/custom-agent-paths'),
  addCustomAgentPath: (path: CustomAgentPath) => apiClient.post<CustomAgentPath>('/custom-agent-paths', path),
  deleteCustomAgentPath: (id: number) => apiClient.delete(`/custom-agent-paths/${id}`),
}

// Directory browsing API function
export const directoryApi = {
  browseDirectories: (path?: string) => apiClient.get<DirectoryBrowseResponse>(`/directories${path ? `?path=${encodeURIComponent(path)}` : ''}`),
}

// Agent configuration API functions (new architecture)
export const agentApi = {
  getAgents: () => apiClient.get<AgentConfiguration[]>('/agents'),
  getAgent: (id: string) => apiClient.get<AgentConfiguration>(`/agents/${id}`),
  createAgent: (agent: AgentConfiguration) => apiClient.post<AgentConfiguration>('/agents', agent),
  updateAgent: (id: string, agent: AgentConfiguration) => apiClient.put<AgentConfiguration>(`/agents/${id}`, agent),
  deleteAgent: (id: string) => apiClient.delete(`/agents/${id}`),
}

// Environment setup API functions (new architecture)
export const environmentApi = {
  getEnvironments: () => apiClient.get<EnvironmentSetup[]>('/environments'),
  getEnvironment: (id: number) => apiClient.get<EnvironmentSetup>(`/environments/${id}`),
  createEnvironment: (env: EnvironmentSetup) => apiClient.post<EnvironmentSetup>('/environments', env),
  updateEnvironment: (id: number, env: EnvironmentSetup) => apiClient.put<EnvironmentSetup>(`/environments/${id}`, env),
  deleteEnvironment: (id: number) => apiClient.delete(`/environments/${id}`),
}

// Session management API functions
export const sessionApi = {
  getSessions: () => apiClient.get<Session[]>('/sessions'),
  getSession: (sessionId: string) => apiClient.get<SessionResponse>(`/sessions/${sessionId}`),
  createSession: (agentFilename: string) => apiClient.post<SessionResponse>('/sessions', { agent_filename: agentFilename }),
  // New method for creating sessions with agent + environment
  createSessionWithConfig: (agentId: string, environmentId: number) => 
    apiClient.post<SessionResponse>('/sessions', { agent_id: agentId, environment_id: environmentId }),
  updateSession: (sessionId: string, data: Partial<Session>) => 
    apiClient.put(`/sessions/${sessionId}`, data),
  updateSessionTitle: (sessionId: string, title: string) => 
    apiClient.put(`/sessions/${sessionId}`, { title }),
  deleteSession: (sessionId: string) => 
    apiClient.delete(`/sessions/${sessionId}`),
}