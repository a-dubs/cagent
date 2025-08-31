import { useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom'
import { Message, Session, SessionResponse, SessionMessage, AgentSetup } from '@/types'
import { apiClient, agentSetupApi, sessionApi } from '@/lib/api'
import { Layout } from '@/components/Layout'
import { EnhancedNewChatModal } from '@/components/EnhancedNewChatModal'
import { AgentMismatchWarningModal } from '@/components/AgentMismatchWarningModal'

export function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)

  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [currentAgentSetup, setCurrentAgentSetup] = useState<AgentSetup | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [agentSetups, setAgentSetups] = useState<AgentSetup[]>([])
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false)
  const [isAgentMismatchWarningOpen, setIsAgentMismatchWarningOpen] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [pendingFallbackSession, setPendingFallbackSession] = useState<{
    sessionResponse: SessionResponse
    session: Session
    fallbackSetup: AgentSetup
  } | null>(null)
  const sseController = useRef<AbortController | null>(null)

  // Check if we're in an active chat
  const isInChat = currentAgentSetup !== null

  // Helper function to add session without duplicates
  const addSessionToList = (newSession: Session) => {
    setSessions(prev => {
      // Check if session already exists
      const existingIndex = prev.findIndex(s => s.id === newSession.id)
      if (existingIndex >= 0) {
        // Update existing session and move to front
        const updated = [...prev]
        updated[existingIndex] = newSession
        updated.unshift(updated.splice(existingIndex, 1)[0])
        return updated
      } else {
        // Add new session to front
        return [newSession, ...prev]
      }
    })
  }

  // Get current page from location
  const getCurrentPage = () => {
    const path = location.pathname
    if (path === '/') return 'home'
    if (path.startsWith('/chat/')) return 'chat'
    if (path === '/agents') return 'setups'
    if (path === '/agents/create') return 'agent-creator'
    if (path === '/environments') return 'environments'
    if (path === '/configs') return 'configs'
    return 'home'
  }

  // Convert backend session messages to frontend Message format
  const convertSessionMessagesToMessages = (sessionMessages: SessionMessage[]): Message[] => {
    return sessionMessages.map((sessionMsg, index) => {
      const message: Message = {
        id: `session-${index}`,
        role: sessionMsg.message.role,
        content: sessionMsg.message.content,
        timestamp: new Date().toISOString(),
      }

      // Convert tool calls if present
      if (sessionMsg.message.tool_calls && sessionMsg.message.tool_calls.length > 0) {
        message.toolCalls = sessionMsg.message.tool_calls.map(tc => ({
          id: tc.id,
          type: tc.type,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments
          }
        }))
      }

      return message
    })
  }

  // Load agent setups on component mount
  useEffect(() => {
    const loadAgentSetups = async () => {
      try {
        const setups = await agentSetupApi.getAgentSetups()
        setAgentSetups(setups)
      } catch (error) {
        console.error('Failed to load agent setups:', error)
      }
    }

    const loadSessions = async () => {
      try {
        const sessionsData = await sessionApi.getSessions()
        setSessions(sessionsData)
      } catch (error) {
        console.error('Failed to load sessions:', error)
      }
    }

    loadAgentSetups()
    loadSessions()
  }, [])

  // Handle session loading from URL params
  useEffect(() => {
    const sessionId = params.sessionId
    if (sessionId && sessionId !== currentSession?.id) {
      handleSessionSelect(sessionId)
    }
  }, [params.sessionId])

  const handleNavigate = (page: string) => {
    switch (page) {
      case 'home':
        navigate('/')
        break
      case 'setups':
        navigate('/agents')
        break
      case 'environments':
        navigate('/environments')
        break
      case 'configs':
        navigate('/configs')
        break
      case 'agent-creator':
        navigate('/agents/create')
        break
      default:
        navigate('/')
    }
  }

  const handleSessionSelect = async (sessionId: string) => {
    // Prevent multiple simultaneous session loads
    if (isLoadingSession) {
      console.log('Session load already in progress, skipping')
      return
    }
    
    // Don't reload if we're already on this session
    if (currentSession?.id === sessionId) {
      console.log('Already on this session, skipping reload')
      return
    }

    setIsLoadingSession(true)
    try {
      console.log('Loading session:', sessionId)
      const sessionResponse = await sessionApi.getSession(sessionId)
      let session = sessions.find(s => s.id === sessionId)
      
      // If session not found in list, we need to get the agent filename from the sessions list API
      if (!session) {
        // Get the session info from the sessions list to get the agent filename
        const allSessions = await sessionApi.getSessions()
        const sessionFromList = allSessions.find(s => s.id === sessionId)
        
        session = {
          id: sessionResponse.id,
          title: sessionResponse.title || 'Untitled Chat',
          created_at: sessionResponse.created_at || new Date().toISOString(),
          num_messages: sessionResponse.messages?.length || 0,
          input_tokens: sessionResponse.input_tokens || 0,
          output_tokens: sessionResponse.output_tokens || 0,
          most_recent_agent_filename: sessionFromList?.most_recent_agent_filename || 'unknown.yaml'
        }
        // Add to sessions list without duplicates
        addSessionToList(session)
      }

      // Find or create agent setup for this session
      let agentSetup = agentSetups.find(setup => 
        setup.agent_config_path === session!.most_recent_agent_filename ||
        setup.agent_config_path === session!.most_recent_agent_filename + '.yaml' ||
        setup.name === session!.most_recent_agent_filename
      )

      if (!agentSetup) {
        // Create a temporary agent setup if not found
        const agentName = session.most_recent_agent_filename.replace('.yaml', '')
        agentSetup = {
          id: Date.now(),
          name: agentName,
          description: 'Agent configuration',
          agent_config_path: agentName + '.yaml',
          working_directory: '/tmp',
          environment_variables: {}
        }
      }

      setCurrentSession(session)
      setCurrentAgentSetup(agentSetup)
      setMessages(convertSessionMessagesToMessages(sessionResponse.messages || []))
      
      // Navigate to chat route
      navigate(`/chat/${sessionId}`)
      console.log('Session loaded successfully:', sessionId, 'with agent:', session.most_recent_agent_filename)
    } catch (error) {
      console.error('Failed to load session:', error)
    } finally {
      setIsLoadingSession(false)
    }
  }

  const handleAgentSetupSelect = async (setup: AgentSetup) => {
    setCurrentAgentSetup(setup)
    setSelectedAgent(setup.agent_config_path)
    
    // Create a new session and navigate to it
    try {
      const sessionResponse = await sessionApi.createSession(setup.agent_config_path)
      const newSession: Session = {
        id: sessionResponse.id,
        title: sessionResponse.title,
        created_at: sessionResponse.created_at,
        num_messages: 0,
        input_tokens: 0,
        output_tokens: 0,
        most_recent_agent_filename: setup.agent_config_path
      }
      
      setCurrentSession(newSession)
      addSessionToList(newSession)
      setMessages([])
      
      navigate(`/chat/${newSession.id}`)
    } catch (error) {
      console.error('Failed to create session:', error)
    }
  }

  const handleNewChat = () => {
    setIsNewChatModalOpen(true)
  }

  const handleCreateNewSession = async (agentFilename: string) => {
    try {
      const sessionResponse = await sessionApi.createSession(agentFilename)
      const newSession: Session = {
        id: sessionResponse.id,
        title: sessionResponse.title,
        created_at: sessionResponse.created_at,
        num_messages: 0,
        input_tokens: 0,
        output_tokens: 0,
        most_recent_agent_filename: agentFilename
      }
      
      // Create a temporary agent setup for this session
      const tempAgentSetup: AgentSetup = {
        id: Date.now(), // Temporary ID
        name: agentFilename.replace('.yaml', ''),
        description: 'Agent configuration',
        agent_config_path: agentFilename,
        working_directory: '/tmp',
        environment_variables: {}
      }
      
      setCurrentSession(newSession)
      setCurrentAgentSetup(tempAgentSetup)
      addSessionToList(newSession)
      setMessages([])
      
      navigate(`/chat/${newSession.id}`)
      return newSession
    } catch (error) {
      console.error('Failed to create session:', error)
      throw error
    }
  }

  const handleSessionRename = async (sessionId: string, newTitle: string) => {
    try {
      await sessionApi.updateSession(sessionId, { title: newTitle })
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title: newTitle } : s
      ))
      if (currentSession?.id === sessionId) {
        setCurrentSession(prev => prev ? { ...prev, title: newTitle } : null)
      }
    } catch (error) {
      console.error('Failed to rename session:', error)
    }
  }

  const handleSessionDelete = async (sessionId: string) => {
    try {
      await sessionApi.deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      
      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
        setCurrentAgentSetup(null)
        setMessages([])
        navigate('/')
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }

  const handleSessionToggleFavorite = (sessionId: string) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, isFavorite: !s.isFavorite } : s
    ))
  }

  const sendMessage = async (content: string) => {
    if (!currentSession || !currentAgentSetup) {
      console.error('Cannot send message: missing session or agent setup', { 
        hasSession: !!currentSession, 
        hasAgentSetup: !!currentAgentSetup 
      })
      return
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      sseController.current = new AbortController()
      
      // Extract agent filename from currentAgentSetup and remove .yaml extension if present
      let agentFilename = currentAgentSetup.agent_config_path || currentAgentSetup.name || 'unknown'
      if (agentFilename.endsWith('.yaml') || agentFilename.endsWith('.yml')) {
        agentFilename = agentFilename.replace(/\.(yaml|yml)$/, '')
      }
      
      // Format message according to backend expectations
      const messages = [{
        role: 'user',
        content: content
      }]
      
      const response = await fetch(`/api/sessions/${currentSession.id}/agent/${agentFilename}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
        signal: sseController.current.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              // Handle different event types from the backend
              if (data.type === 'agent_choice' && data.choice?.delta?.content) {
                // Backend sends streaming content in agent_choice events
                assistantMessage = {
                  ...assistantMessage,
                  content: assistantMessage.content + data.choice.delta.content
                }
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = assistantMessage
                  return newMessages
                })
              } else if (data.type === 'content') {
                // Fallback for direct content events
                assistantMessage = {
                  ...assistantMessage,
                  content: assistantMessage.content + data.content
                }
                setMessages(prev => {
                  const newMessages = [...prev]
                  newMessages[newMessages.length - 1] = assistantMessage
                  return newMessages
                })
              } else if (data.type === 'session_title') {
                // Update session title when received
                if (currentSession && data.session_id === currentSession.id) {
                  setCurrentSession(prev => prev ? { ...prev, title: data.title } : prev)
                  setSessions(prev => prev.map(s => 
                    s.id === data.session_id ? { ...s, title: data.title } : s
                  ))
                }
              }
              // Log other event types for debugging
              console.log('SSE Event:', data.type, data)
            } catch (e) {
              // Ignore JSON parsing errors for non-JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      setMessages(prev => prev.slice(0, -1)) // Remove the user message on error
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleToolApproval = async (toolId: string, approval: 'approve' | 'approve-session' | 'reject') => {
    if (!currentSession) return
    
    setMessages((prev) => {
      const newMessages = [...prev]
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

    try {
      await apiClient.post(`/sessions/${currentSession.id}/resume`, { confirmation: approval })
    } catch (e) {
      console.error('Failed to send tool approval', e)
    }
  }

  const handleStartSession = async () => {
    if (!currentAgentSetup) return
    
    try {
      const sessionResponse = await sessionApi.createSession(currentAgentSetup.agent_config_path)
      const newSession: Session = {
        id: sessionResponse.id,
        title: sessionResponse.title,
        created_at: sessionResponse.created_at,
        num_messages: 0,
        input_tokens: 0,
        output_tokens: 0,
        most_recent_agent_filename: currentAgentSetup.agent_config_path
      }
      
      setCurrentSession(newSession)
      addSessionToList(newSession)
      setMessages([])
      
      navigate(`/chat/${newSession.id}`)
    } catch (error) {
      console.error('Failed to start session:', error)
    }
  }

  const handleAgentMismatchWarningClose = () => {
    setIsAgentMismatchWarningOpen(false)
    setPendingFallbackSession(null)
  }

  const handleAgentMismatchWarningProceed = () => {
    if (pendingFallbackSession) {
      setCurrentSession(pendingFallbackSession.session)
      setCurrentAgentSetup(pendingFallbackSession.fallbackSetup)
      setMessages(convertSessionMessagesToMessages(pendingFallbackSession.sessionResponse.messages))
      navigate(`/chat/${pendingFallbackSession.session.id}`)
    }
    setIsAgentMismatchWarningOpen(false)
    setPendingFallbackSession(null)
  }

  // Context value for child components
  const appContext = {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    isLoadingSession,
    currentSession,
    setCurrentSession,
    selectedAgent,
    setSelectedAgent,
    currentAgentSetup,
    setCurrentAgentSetup,
    sessions,
    setSessions,
    agentSetups,
    setAgentSetups,
    sseController,
    isInChat,
    sendMessage,
    sendConfirmation,
    handleToolApproval,
    handleStartSession,
    handleAgentSetupSelect,
    handleSessionSelect,
    handleNewChat,
    handleCreateNewSession,
    handleSessionRename,
    handleSessionDelete,
    handleSessionToggleFavorite,
    handleNavigate
  }

  return (
    <>
      <Layout
        currentPage={getCurrentPage()}
        currentSessionId={currentSession?.id}
        sessions={sessions}
        agentSetups={agentSetups}
        onNavigate={handleNavigate}
        onSessionSelect={handleSessionSelect}
        onNewChat={handleNewChat}
        onSessionRename={handleSessionRename}
        onSessionDelete={handleSessionDelete}
        onSessionToggleFavorite={handleSessionToggleFavorite}
        showNewChatButton={isInChat}
      >
        <Outlet context={appContext} />
      </Layout>

      <EnhancedNewChatModal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        onNavigate={handleNavigate}
        onCreateSession={handleCreateNewSession}
      />

      <AgentMismatchWarningModal
        isOpen={isAgentMismatchWarningOpen}
        onClose={handleAgentMismatchWarningClose}
        onProceed={handleAgentMismatchWarningProceed}
        sessionTitle={pendingFallbackSession?.session.title || ''}
        agentFilename={pendingFallbackSession?.session.most_recent_agent_filename || ''}
        fallbackSetupName={pendingFallbackSession?.fallbackSetup.name || ''}
      />
    </>
  )
}