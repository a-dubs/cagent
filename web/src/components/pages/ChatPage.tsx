
import { ChatInterface } from '@/components/ChatInterface'
import { Message, AgentSetup } from '@/types'

interface ChatPageProps {
  messages: Message[]
  isLoading: boolean
  currentAgentSetup: AgentSetup | null
  onSendMessage: (content: string) => void
  onConfirm: (confirmation: 'approve' | 'approve-session' | 'reject') => void
  onToolApprove: (toolCallId: string, approval: 'approve' | 'approve-session' | 'reject') => void
}

export function ChatPage({
  messages,
  isLoading,
  currentAgentSetup,
  onSendMessage,
  onConfirm,
  onToolApprove
}: ChatPageProps) {
  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
      <div className="flex-1">
        <ChatInterface 
          messages={messages}
          onSendMessage={onSendMessage}
          isLoading={isLoading}
          onConfirm={onConfirm}
                        onToolApprove={(toolCallId) => onToolApprove(toolCallId, 'approve')}
        />
      </div>
    </div>
  )
}
