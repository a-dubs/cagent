
import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChatInterface } from '@/components/ChatInterface'
import { ChatConfigurationPanel } from '@/components/ChatConfigurationPanel'
import { useAppContext } from '@/hooks/useAppContext'
import { AgentConfiguration, EnvironmentSetup } from '@/types'

export function ChatPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const {
    messages,
    isLoading,
    currentAgentSetup,
    currentSession,
    sendMessage,
    sendConfirmation,
    handleToolApproval,
    handleStartSession,
    handleSessionSelect
  } = useAppContext()

  // New state for agent/environment separation
  const [currentAgent, setCurrentAgent] = useState<AgentConfiguration | null>(null)
  const [currentEnvironment, setCurrentEnvironment] = useState<EnvironmentSetup | null>(null)
  const lastSessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (sessionId && sessionId !== lastSessionIdRef.current) {
      console.log('ChatPage: Session ID changed, loading session:', sessionId)
      lastSessionIdRef.current = sessionId
      handleSessionSelect(sessionId)
    }
  }, [sessionId, handleSessionSelect])

  // Redirect to home if no session ID
  useEffect(() => {
    if (!sessionId) {
      navigate('/', { replace: true })
    }
  }, [sessionId, navigate])
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="font-semibold">{currentAgent?.name || currentAgentSetup?.name || 'Chat Session'}</h2>
                <div className="text-sm text-muted-foreground">
                  {currentAgent?.description || currentAgentSetup?.description}
                </div>
              </div>
            </div>
            
            {currentSession && (
              <ChatConfigurationPanel
                currentSession={currentSession}
                currentAgent={currentAgent}
                currentEnvironment={currentEnvironment}
                onAgentChange={(agent) => {
                  setCurrentAgent(agent)
                  console.log('Agent changed to:', agent.name)
                }}
                onEnvironmentChange={(env) => {
                  setCurrentEnvironment(env)
                  console.log('Environment changed to:', env.name)
                }}
              />
            )}
          </div>
          
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-4">
            <span>Agent: {currentAgent?.model || currentAgentSetup?.name || 'Unknown'}</span>
            <span>•</span>
            <span>Environment: {currentEnvironment?.name || 'Default'}</span>
            <span>•</span>
            <span>Working Dir: {currentEnvironment?.working_directory || currentAgentSetup?.working_directory || '/tmp'}</span>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 min-h-0">
        <ChatInterface 
          messages={messages}
          onSendMessage={sendMessage}
          isLoading={isLoading}
          onConfirm={sendConfirmation}
          onToolApprove={(toolCallId) => handleToolApproval(toolCallId, 'approve')}
          showStartSession={!!(currentSession && !currentAgentSetup)}
          onStartSession={handleStartSession}
          agentFilename={currentSession?.most_recent_agent_filename}
        />
      </div>
    </div>
  )
}
