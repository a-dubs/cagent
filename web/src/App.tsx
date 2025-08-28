import { useState } from 'react'
import { ChatInterface } from '@/components/ChatInterface'
import { SettingsDialog } from '@/components/SettingsDialog'
import { Button } from '@/components/ui/button'
import { Settings, FileText, Play, Square } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { Message, Session } from '@/types'
import { apiClient } from '@/lib/api'

export function App() {
  const { settings } = useSettings()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSession, setCurrentSession] = useState<Session | null>(null)
  const [agentRunning, setAgentRunning] = useState(false)

  // Check if settings are configured
  const isConfigured = settings.agentConfigPath.trim() !== ''

  const startNewSession = async () => {
    try {
      if (!isConfigured) {
        alert('Please configure your agent settings first')
        return
      }

      const session = await apiClient.post<Session>('/sessions', {
        agentPath: settings.agentConfigPath,
        workingDir: settings.workingDirectory,
        envVars: settings.environmentVariables
      })

      setCurrentSession(session)
      setMessages([])
      setAgentRunning(true)
    } catch (error) {
      console.error('Failed to start session:', error)
      alert('Failed to start agent session. Please check your configuration.')
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
    if (!currentSession || !agentRunning) {
      alert('No active session. Please start an agent session first.')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // For now, we'll simulate the streaming response
      // In a real implementation, you'd connect to the streaming endpoint
      const response = await apiClient.post(`/sessions/${currentSession.id}/agent/root`, {
        message: content
      }) as any

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message || 'Agent response received',
        timestamp: new Date().toISOString(),
        toolCalls: response.toolCalls
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Failed to send message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date().toISOString()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
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
            <span>Config: {settings.agentConfigPath || 'Not configured'}</span>
            <span>•</span>
            <span>Working Dir: {settings.workingDirectory}</span>
            <span>•</span>
            <span>Env Vars: {Object.keys(settings.environmentVariables).length}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {!isConfigured ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 p-8">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
              <h2 className="text-2xl font-semibold">Welcome to cagent</h2>
              <p className="text-muted-foreground max-w-md">
                Get started by configuring your agent settings. You'll need to specify 
                an agent configuration file and set up your working directory.
              </p>
              <SettingsDialog>
                <Button size="lg" className="mt-4">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Settings
                </Button>
              </SettingsDialog>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <ChatInterface 
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  )
}