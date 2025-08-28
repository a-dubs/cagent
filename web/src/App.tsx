import { useEffect, useRef, useState } from 'react'
import { Message, Session, PendingToolCall, CompletedToolCall, AgentSetup } from '@/types'
import { apiClient, agentSetupApi } from '@/lib/api'
import { Layout } from '@/components/Layout'
import { HomePage } from '@/components/pages/HomePage'
import { AgentSetupsPage } from '@/components/pages/AgentSetupsPage'
import { ConfigManagerPage } from '@/components/pages/ConfigManagerPage'
import { ChatPage } from '@/components/pages/ChatPage'
import { NewChatModal } from '@/components/NewChatModal'

export function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)

  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [currentAgentSetup, setCurrentAgentSetup] = useState<AgentSetup | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [agentSetups, setAgentSetups] = useState<AgentSetup[]>([])
  const [currentPage, setCurrentPage] = useState<string>('home')
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
  const sseController = useRef<AbortController | null>(null)

  // Check if we're in an active chat
  const isInChat = currentAgentSetup !== null

  useEffect(() => {
    // load chat sessions and agent setups
    loadSessions()
    loadAgentSetups()
  }, [])

  const loadAgentSetups = async () => {
    try {
      const data = await agentSetupApi.getAgentSetups()
      setAgentSetups(data || [])
    } catch (error) {
      console.error('Failed to load agent setups:', error)
    }
  }

  const loadSessions = async () => {
    try {
      const data = await apiClient.get<Session[]>('/sessions')
      setSessions(data)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }



  const loadSession = async (sessionId: string) => {
    try {
      const session = await apiClient.get<Session>(`/sessions/${sessionId}`)
      setCurrentSession(session)
      // Convert session messages to Message format if needed
      setMessages([]) // Will need to implement message conversion
      setCurrentPage('chat')
    } catch (error) {
      console.error('Failed to load session:', error)
    }
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page)
  }

  const handleSessionSelect = (sessionId: string) => {
    loadSession(sessionId)
  }

  const handleNewChat = () => {
    setIsNewChatModalOpen(true)
  }

  const handleAgentSetupSelect = async (setup: AgentSetup) => {
    try {
      // Don't create session immediately - just set up the chat state
      setCurrentSession(null) // Clear any existing session
      setCurrentAgentSetup(setup)
      setSelectedAgent(setup.agent_config_path) // Use agent config path as agent reference
      setMessages([]) // Clear any existing messages
      setIsLoading(false)
      
      // Navigate to chat page
      setCurrentPage('chat')
      
      console.log('Set up new chat with agent setup:', setup.name)
    } catch (error) {
      console.error('Failed to set up new chat:', error)
      alert('Failed to set up new chat. Please try again.')
    }
  }



  const sendMessage = async (content: string) => {
    if (!currentAgentSetup || !selectedAgent) {
      alert('No agent setup selected. Please select an agent setup first.')
      return
    }

    // Create session on first message if it doesn't exist
    let sessionToUse = currentSession
    if (!sessionToUse) {
      try {
        sessionToUse = await apiClient.post<Session>('/sessions')
        setCurrentSession(sessionToUse)
        
        // Reload sessions to include the new one
        loadSessions()
        
        console.log('Created session on first message:', sessionToUse.id)
      } catch (error) {
        console.error('Failed to create session:', error)
        alert('Failed to create session. Please try again.')
        return
      }
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

      const stream = await apiClient.streamPost(`/sessions/${sessionToUse.id}/agent/${encodeURIComponent(selectedAgent)}`, body)
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
    if (!currentSession) {
      console.warn('No active session for confirmation')
      return
    }
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

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <HomePage
            recentSetups={agentSetups}
            onSetupSelect={handleAgentSetupSelect}
            onNavigateToSetups={() => setCurrentPage('setups')}
            onNavigateToConfigs={() => setCurrentPage('configs')}
          />
        )
      case 'setups':
        return <AgentSetupsPage onSetupSelect={handleAgentSetupSelect} />
      case 'configs':
        return <ConfigManagerPage />
      case 'chat':
        return (
          <ChatPage
            messages={messages}
            isLoading={isLoading}
            currentAgentSetup={currentAgentSetup}
            onSendMessage={sendMessage}
            onConfirm={(c: 'approve' | 'approve-session' | 'reject') => sendConfirmation(c)}
            onToolApprove={handleToolApproval}
          />
        )
      default:
        return (
          <HomePage
            recentSetups={agentSetups}
            onSetupSelect={handleAgentSetupSelect}
            onNavigateToSetups={() => setCurrentPage('setups')}
            onNavigateToConfigs={() => setCurrentPage('configs')}
          />
        )
    }
  }

  return (
    <>
      <Layout
        currentPage={currentPage}
        currentSessionId={currentSession?.id}
        sessions={sessions}
        onNavigate={handleNavigate}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        showNewChatButton={isInChat}
      >
        {renderPage()}
      </Layout>

      <NewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        agentSetups={agentSetups}
        onSetupSelect={handleAgentSetupSelect}
        onCreateSetup={() => {
          setIsNewChatModalOpen(false)
          setCurrentPage('setups')
        }}
      />
    </>
  )
}