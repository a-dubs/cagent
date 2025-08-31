import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, Play, Plus, FolderOpen } from 'lucide-react'
import { AgentConfiguration, EnvironmentSetup } from '@/types'

interface EnhancedNewChatModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EnhancedNewChatModal({ isOpen, onClose }: EnhancedNewChatModalProps) {
  const navigate = useNavigate()
  
  const [selectedAgent, setSelectedAgent] = useState<AgentConfiguration | null>(null)
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentSetup | null>(null)
  const [agents, setAgents] = useState<AgentConfiguration[]>([])
  const [environments, setEnvironments] = useState<EnvironmentSetup[]>([])

  useEffect(() => {
    if (isOpen) {
      loadAgents()
      loadEnvironments()
    }
  }, [isOpen])

  const loadAgents = async () => {
    // TODO: Replace with actual API call
    const mockAgents: AgentConfiguration[] = [
      {
        id: 'code-assistant',
        name: 'Code Assistant',
        description: 'Expert software developer and coding assistant',
        config_filename: 'code-assistant.yaml',
        model: 'gpt-4',
        provider: 'openai',
        instruction: 'You are an expert software developer...',
        toolsets: ['shell', 'file'],
        created_at: new Date().toISOString()
      },
      {
        id: 'data-analyst',
        name: 'Data Analyst',
        description: 'Specialized data analysis expert',
        config_filename: 'data-analyst.yaml',
        model: 'claude-3-sonnet',
        provider: 'anthropic',
        instruction: 'You are a skilled data analyst...',
        toolsets: ['file', 'database'],
        created_at: new Date().toISOString()
      }
    ]
    setAgents(mockAgents)
  }

  const loadEnvironments = async () => {
    // TODO: Replace with actual API call
    const mockEnvironments: EnvironmentSetup[] = [
      {
        id: 1,
        name: 'Default',
        description: 'Default environment with no special configuration',
        working_directory: '/tmp',
        environment_variables: {}
      },
      {
        id: 2,
        name: 'Development',
        description: 'Development environment with Node.js and Python',
        working_directory: '/workspace',
        environment_variables: {
          'NODE_ENV': 'development',
          'PYTHONPATH': '/workspace/scripts'
        }
      },
      {
        id: 3,
        name: 'Production',
        description: 'Production environment with optimized settings',
        working_directory: '/app',
        environment_variables: {
          'NODE_ENV': 'production',
          'LOG_LEVEL': 'info'
        }
      }
    ]
    setEnvironments(mockEnvironments)
    // Auto-select default environment
    setSelectedEnvironment(mockEnvironments[0])
  }

  const handleStartChat = async () => {
    if (!selectedAgent) return

    try {
      // Create new chat session with selected agent and environment
      // TODO: Update API to accept both agent and environment

      // For now, create a mock session
      const newSessionId = `session-${Date.now()}`
      navigate(`/chat/${newSessionId}`)
      onClose()
    } catch (error) {
      console.error('Failed to create chat session:', error)
    }
  }

  const canStartChat = selectedAgent !== null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Start New Chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Tabs defaultValue="agent" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="agent">Select Agent</TabsTrigger>
              <TabsTrigger value="environment">Select Environment</TabsTrigger>
            </TabsList>

            <TabsContent value="agent" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Choose an AI Agent</h3>
                  <p className="text-sm text-muted-foreground">
                    Select the AI agent that will handle your conversation
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    onClose()
                    navigate('/agents/create')
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create New
                </Button>
              </div>

              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {agents.map((agent) => (
                  <Card 
                    key={agent.id}
                    className={`cursor-pointer transition-colors ${
                      selectedAgent?.id === agent.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            <Bot className="h-4 w-4 text-primary" />
                            {agent.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{agent.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Model: {agent.model}</span>
                            <span>•</span>
                            <span>Tools: {agent.toolsets.join(', ')}</span>
                          </div>
                        </div>
                        {selectedAgent?.id === agent.id && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="environment" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Choose Environment</h3>
                  <p className="text-sm text-muted-foreground">
                    Select the working environment (directory, variables, etc.)
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    onClose()
                    navigate('/environments')
                  }}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create New
                </Button>
              </div>

              <div className="grid gap-3 max-h-60 overflow-y-auto">
                {environments.map((env) => (
                  <Card 
                    key={env.id}
                    className={`cursor-pointer transition-colors ${
                      selectedEnvironment?.id === env.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedEnvironment(env)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-primary" />
                            {env.name}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">{env.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Dir: {env.working_directory}</span>
                            <span>•</span>
                            <span>Vars: {Object.keys(env.environment_variables).length}</span>
                          </div>
                        </div>
                        {selectedEnvironment?.id === env.id && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Selected Summary */}
          <div className="border-t pt-4">
            <div className="space-y-3">
              <h3 className="font-medium">Chat Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded">
                  <div className="text-sm font-medium mb-1">Agent</div>
                  {selectedAgent ? (
                    <div className="text-sm text-muted-foreground">
                      {selectedAgent.name} ({selectedAgent.model})
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">No agent selected</div>
                  )}
                </div>
                <div className="p-3 bg-muted rounded">
                  <div className="text-sm font-medium mb-1">Environment</div>
                  {selectedEnvironment ? (
                    <div className="text-sm text-muted-foreground">
                      {selectedEnvironment.name} ({selectedEnvironment.working_directory})
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">Default environment</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleStartChat}
              disabled={!canStartChat}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Chat
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}