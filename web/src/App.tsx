import { useEffect, useRef, useState } from 'react'
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
  const [agents, setAgents] = useState<{ name: string; description: string }[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const sseController = useRef<AbortController | null>(null)

  // Check if settings are configured
  const isConfigured = selectedAgent.trim() !== ''

  useEffect(() => {
    // load agents from backend
    apiClient.get<{ name: string; description: string }[]>(`/agents`).then(setAgents).catch(() => {})
  }, [])

  useEffect(() => {
    // if user stored a preferred agent name, select it when list loads
    if (!selectedAgent && settings.agentConfigPath) {
      setSelectedAgent(settings.agentConfigPath)
    } else if (!selectedAgent && agents.length > 0) {
      setSelectedAgent(agents[0].name)
    }
  }, [agents])

  const startNewSession = async () => {
    try {
      if (!isConfigured) {
        alert('Please configure your agent settings first')
        return
      }

  const session = await apiClient.post<Session>('/sessions')

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

      const finishAssistant = (acc: string) => {
        if (!acc) return
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: acc,
          timestamp: new Date().toISOString(),
        }
  setMessages((prev: Message[]) => [...prev, assistantMessage])
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
              if (evt.type === 'agent_choice' && evt.choice?.delta?.content) {
                accContent += evt.choice.delta.content
              } else if (evt.type === 'error') {
                throw new Error(evt.error || 'Agent error')
              }
            } catch (e) {
              // ignore parse errors of non-JSON events
            }
          }
        }
      }

      finishAssistant(accContent)
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
            <span>Agent: {selectedAgent || 'Not selected'}</span>
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
                Get started by configuring your agent settings. Select an agent and set up your working directory.
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