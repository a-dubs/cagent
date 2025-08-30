
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChatInterface } from '@/components/ChatInterface'
import { useAppContext } from '@/hooks/useAppContext'

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

  useEffect(() => {
    if (sessionId && sessionId !== currentSession?.id) {
      handleSessionSelect(sessionId)
    }
  }, [sessionId, currentSession?.id, handleSessionSelect])

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
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-semibold">{currentAgentSetup?.name || 'Chat Session'}</h2>
              {currentAgentSetup && (
                <div className="text-sm text-muted-foreground">
                  {currentAgentSetup.description}
                </div>
              )}
            </div>
          </div>
          
          {currentAgentSetup && (
            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-4">
              <span>Working Dir: {currentAgentSetup.working_directory}</span>
              <span>•</span>
              <span>Env Vars: {Object.keys(currentAgentSetup.environment_variables).length}</span>
            </div>
          )}
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
