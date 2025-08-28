import { useEffect, useRef, useState } from 'react'
import { ChatInterface } from '@/components/ChatInterface'
import { SettingsDialog } from '@/components/SettingsDialog'
import { Button } from '@/components/ui/button'
import { Settings, FileText, Play, Square, Plus } from 'lucide-react'

import { Message, Session, PendingToolCall, CompletedToolCall, AgentSetup } from '@/types'
import { apiClient } from '@/lib/api'
import { AgentSetupManager } from '@/components/AgentSetupManager'
import { AgentConfigManager } from '@/components/AgentConfigManager'

export function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [agentRunning, setAgentRunning] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [currentAgentSetup, setCurrentAgentSetup] = useState<AgentSetup | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const sseController = useRef<AbortController | null>(null)

  // Check if settings are configured
  const isConfigured = currentAgentSetup !== null && currentSession !== null

  useEffect(() => {
    // load chat sessions
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const data = await apiClient.get<Session[]>('/sessions')
      setSessions(data)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }

  const startNewSession = async () => {
    try {
      if (!isConfigured) {
        alert('Please configure your agent setup first')
        return
      }

      const session = await apiClient.post<Session>('/sessions')
      setCurrentSession(session)
      setMessages([])
      setAgentRunning(true)
      loadSessions() // Refresh session list
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Failed to start agent session. Please check your configuration.')
    }
  }

  const loadSession = async (sessionId: string) => {
    try {
      const session = await apiClient.get<Session>(`/sessions/${sessionId}`)
      setCurrentSession(session)
      // Convert session messages to Message format if needed
      setMessages([]) // Will need to implement message conversion
      setAgentRunning(false)
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  const handleAgentSetupSelect = async (setup: AgentSetup) => {
    try {
      // Create a new session
      const newSession = await apiClient.post<Session>('/sessions')
      setCurrentSession(newSession)
      setCurrentAgentSetup(setup)
      setSelectedAgent(setup.agent_config_path) // Use agent config path as agent reference
      setMessages([]) // Clear any existing messages
      setIsLoading(false)
      setAgentRunning(false)
      
      // Reload sessions to include the new one
      loadSessions()
      
      console.log('Started new session with agent setup:', setup.name)
    } catch (error) {
      console.error('Failed to create session for agent setup:', error)
      alert('Failed to start new session. Please try again.')
    }
  }

  const stopSession = async () => {
    if (currentSession) {
      try {
        await apiClient.delete(`/sessions/${currentSession.id}`)
        setCurrentSession(null)
        setAgentRunning(false)
      } catch (error) {
        console.error('Failed to stop session:', error)
      }
    }
  }

  const sendMessage = async (content: string) => {
  if (!currentSession || !agentRunning || !selectedAgent) {
      alert('No active session. Please start an agent session first.')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

  setMessages((prev: Message[]) => [...prev, userMessage])
    setIsLoading(true)

    try {
      // The backend expects an array of messages with role/content
      const body = [ { role: 'user', content } ]

      // Start SSE stream
      sseController.current?.abort()
      const controller = new AbortController()
      sseController.current = controller

      const stream = await apiClient.streamPost(`/sessions/${currentSession.id}/agent/${encodeURIComponent(selectedAgent)}`, body)
      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      // Create the assistant message that will accumulate content and tools
      const assistantMessageId = (Date.now() + 1).toString()
      let assistantMessageCreated = false
      
      const ensureAssistantMessage = () => {
        if (!assistantMessageCreated) {
          const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            pendingTools: [],
            completedTools: []
          }
          setMessages((prev: Message[]) => [...prev, assistantMessage])
          assistantMessageCreated = true
        }
      }

      const updateAssistantMessage = (updater: (msg: Message) => Message) => {
        setMessages((prev) => {
          const newMessages = [...prev]
          const assistantIndex = newMessages.findIndex(m => m.id === assistantMessageId)
          if (assistantIndex >= 0) {
            newMessages[assistantIndex] = updater(newMessages[assistantIndex])
          }
          return newMessages
        })
      }

      let accContent = ''

      // Read SSE chunks
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // Process lines
        const lines = buffer.split(/\r?\n/)
        buffer = lines.pop() || ''
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim()
            if (!dataStr) continue
            try {
              const evt = JSON.parse(dataStr)
              // Process known event types
              if (evt.type === 'agent_choice' && evt.choice?.delta?.content) {
                accContent += evt.choice.delta.content
                ensureAssistantMessage()
                updateAssistantMessage(msg => ({ ...msg, content: accContent }))
              } else if (evt.type === 'tool_call_confirmation') {
                const toolName = evt.tool_call?.function?.name || 'Tool'
                const args = evt.tool_call?.function?.arguments
                const toolId = evt.tool_call?.id || Date.now().toString()
                
                const pendingTool: PendingToolCall = {
                  id: toolId,
                  name: toolName,
                  args: args,
                  status: 'pending_approval',
                  timestamp: new Date().toISOString()
                }
                
                ensureAssistantMessage()
                updateAssistantMessage(msg => ({
                  ...msg,
                  pendingTools: [...(msg.pendingTools || []), pendingTool]
                }))
              } else if (evt.type === 'tool_call') {
                // Tool execution started - mark as executing
                const toolId = evt.tool_call?.id
                if (toolId) {
                  ensureAssistantMessage()
                  updateAssistantMessage(msg => ({
                    ...msg,
                    pendingTools: (msg.pendingTools || []).map(tool => 
                      tool.id === toolId ? { ...tool, status: 'executing' as const } : tool
                    )
                  }))
                }
              } else if (evt.type === 'tool_call_response') {
                // Tool execution completed
                const toolName = evt.tool_call?.function?.name || 'Tool'
                const args = evt.tool_call?.function?.arguments
                const output = evt.response || ''
                const toolId = evt.tool_call?.id || Date.now().toString()

                const completedTool: CompletedToolCall = {
                  id: toolId,
                  name: toolName,
                  args: args,
                  output: output,
                  timestamp: new Date().toISOString()
                }

                // If this is a "think" style tool, parse into thinking block
                if ((toolName || '').toLowerCase().includes('think')) {
                  const [first, ...rest] = (output || '').split(/\r?\n/)
                  completedTool.thinking = {
                    summary: first || 'Thinking...',
                    full: rest.join('\n') || output || ''
                  }
                }

                ensureAssistantMessage()
                updateAssistantMessage(msg => ({
                  ...msg,
                  pendingTools: (msg.pendingTools || []).filter(t => t.id !== toolId),
                  completedTools: [...(msg.completedTools || []), completedTool]
                }))
              } else if (evt.type === 'error') {
                throw new Error(evt.error || 'Agent error')
              }
            } catch (e) {
              // ignore parse errors of non-JSON events
            }
          }
        }
      }

      // Final content update if there's any remaining content
      if (accContent) {
        ensureAssistantMessage()
        updateAssistantMessage(msg => ({ ...msg, content: accContent }))
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      }
  setMessages((prev: Message[]) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Send resume / confirmation to server: confirmation can be 'approve', 'approve-session', or 'reject'
  const sendConfirmation = async (confirmation: 'approve' | 'approve-session' | 'reject') => {
    if (!currentSession) return
    try {
  await apiClient.post(`/sessions/${currentSession.id}/resume`, { confirmation })
    } catch (e) {
      console.error('Failed to send confirmation', e)
    }
  }

  // Handle tool approval from the enhanced UI
  const handleToolApproval = async (toolId: string, approval: 'approve' | 'approve-session' | 'reject') => {
    if (!currentSession) return
    
    // Update the tool status to show it's been approved/rejected
    setMessages((prev) => {
      const newMessages = [...prev]
      // Find the message that contains this tool
      for (let i = newMessages.length - 1; i >= 0; i--) {
        if (newMessages[i].role === 'assistant' && newMessages[i].pendingTools) {
          const toolIndex = newMessages[i].pendingTools!.findIndex(t => t.id === toolId)
          if (toolIndex >= 0) {
            const updatedMessage = { ...newMessages[i] }
            updatedMessage.pendingTools = [...(updatedMessage.pendingTools || [])]
            updatedMessage.pendingTools[toolIndex] = {
              ...updatedMessage.pendingTools[toolIndex],
              status: approval === 'reject' ? 'pending_approval' : 'approved' as const
            }
            newMessages[i] = updatedMessage
            break
          }
        }
      }
      return newMessages
    })

    // Send the approval to the backend
    try {
      await apiClient.post(`/sessions/${currentSession.id}/resume`, { confirmation: approval })
    } catch (e) {
      console.error('Failed to send tool approval', e)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <h1 className="text-xl font-semibold">cagent</h1>
            {currentSession && (
              <span className="text-sm text-muted-foreground">
                • Session Active
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Agent Control */}
            {!agentRunning ? (
              <Button 
                onClick={startNewSession} 
                disabled={!isConfigured}
                className="flex items-center gap-2"
              >
                <Play className="h-4 w-4" />
                Start Agent
              </Button>
            ) : (
              <Button 
                onClick={stopSession}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Agent
              </Button>
            )}
            
            {/* New Chat Button */}
            {isConfigured && (
              <Button 
                onClick={() => handleAgentSetupSelect(currentAgentSetup!)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            )}
            
            <SettingsDialog>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </SettingsDialog>
          </div>
        </div>

        {/* Status Bar */}
        <div className="px-4 pb-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span>Setup: {currentAgentSetup?.name || 'Not configured'}</span>
            {currentAgentSetup && (
              <>
                <span>•</span>
                <span>Working Dir: {currentAgentSetup.working_directory}</span>
                <span>•</span>
                <span>Env Vars: {Object.keys(currentAgentSetup.environment_variables).length}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {!isConfigured ? (
          <div className="flex-1 flex">
            {/* Left sidebar - Agent Configuration & Setup Managers */}
            <div className="w-1/3 border-r p-4 overflow-y-auto space-y-6">
              <AgentConfigManager />
              <AgentSetupManager onSetupSelect={handleAgentSetupSelect} />
            </div>
            
            {/* Right side - Session History */}
            <div className="flex-1 p-4">
              <div className="text-center space-y-4">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                <h2 className="text-2xl font-semibold">Welcome to cagent</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Select an agent setup from the left to get started, or create a new one.
                </p>
              </div>
              
              {sessions.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Recent Sessions</h3>
                  <div className="space-y-2">
                    {sessions.slice(0, 10).map((session) => (
                      <div
                        key={session.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-muted"
                        onClick={() => loadSession(session.id)}
                      >
                        <div className="font-medium">{session.title || 'Untitled Session'}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(session.createdAt || '').toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <ChatInterface 
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
              onConfirm={(c) => sendConfirmation(c)}
              onToolApprove={handleToolApproval}
            />
          </div>
        )}
      </div>
    </div>
  )
}