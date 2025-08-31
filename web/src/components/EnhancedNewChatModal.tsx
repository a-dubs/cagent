import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, Play, Plus, FolderOpen } from 'lucide-react'
import { AgentConfiguration, EnvironmentSetup } from '@/types'
import { apiClient } from '@/lib/api'

interface EnhancedNewChatModalProps {
  isOpen: boolean
  onClose: () => void
  onNavigate: (page: string) => void
  onCreateSession: (agentFilename: string) => Promise<any>
}

export function EnhancedNewChatModal({ 
  isOpen, 
  onClose, 
  onNavigate,
  onCreateSession
}: EnhancedNewChatModalProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentConfiguration | null>(null)
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentSetup | null>(null)
  const [agents, setAgents] = useState<AgentConfiguration[]>([])
  const [environments, setEnvironments] = useState<EnvironmentSetup[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadAgents()
      loadEnvironments()
    }
  }, [isOpen])

  const loadAgents = async () => {
    try {
      // First get the list of agent names
      const agentList = await apiClient.get<{name: string, description: string}[]>('/agents')
      console.log('Agent list from API:', agentList)
      
      if (!Array.isArray(agentList)) {
        console.error('Agent list is not an array:', agentList)
        setAgents([])
        return
      }
      
      // Then fetch detailed configuration for each agent
      const agentDetailsPromises = agentList.map(async (agentSummary) => {
        try {
          const agentDetails = await apiClient.get<{
            agents: { root: { model: string, description: string, toolsets?: any[], instruction: string } },
            models: { [key: string]: { provider: string, model: string } }
          }>(`/agents/${agentSummary.name}`)
          
          const rootAgent = agentDetails.agents?.root
          if (!rootAgent) {
            console.warn(`No root agent found for ${agentSummary.name}`)
            return null
          }
          
          // Extract model and provider information
          const modelInfo = agentDetails.models?.[rootAgent.model]
          const provider = modelInfo?.provider || 'Unknown'
          const modelName = modelInfo?.model || rootAgent.model || 'Unknown'
          
          // Extract toolsets information
          const toolsets = rootAgent.toolsets || []
          const toolsetNames = toolsets.map(t => t.type || 'Unknown').join(', ') || 'None'
          
          return {
            id: agentSummary.name,
            name: agentSummary.name,
            description: rootAgent.description || agentSummary.description || 'No description available',
            model: modelName,
            provider: provider,
            toolsets: toolsets,
            toolset_display: toolsetNames,
            instruction: rootAgent.instruction || '',
            config_filename: agentSummary.name,
            created_at: new Date().toISOString()
          }
        } catch (error) {
          console.error(`Failed to load details for agent ${agentSummary.name}:`, error)
          // Return a fallback agent configuration
          return {
            id: agentSummary.name,
            name: agentSummary.name,
            description: agentSummary.description || 'No description available',
            model: 'Unknown',
            provider: 'Unknown',
            toolsets: [],
            toolset_display: 'None',
            instruction: '',
            config_filename: agentSummary.name,
            created_at: new Date().toISOString()
          }
        }
      })
      
      const agentDetails = await Promise.all(agentDetailsPromises)
      const validAgents = agentDetails.filter(agent => agent !== null)
      
      console.log('Processed agents with details:', validAgents)
      setAgents(validAgents)
    } catch (error) {
      console.error('Failed to load agents:', error)
      setAgents([])
    }
  }

  const loadEnvironments = async () => {
    try {
      // Since /api/environments doesn't exist yet, use mock data
      const mockEnvironments: EnvironmentSetup[] = [
        {
          id: 1,
          name: 'Default',
          description: 'Default environment with standard settings',
          working_directory: '/tmp',
          environment_variables: {}
        },
        {
          id: 2,
          name: 'Development',
          description: 'Development environment with dev tools',
          working_directory: '/workspace',
          environment_variables: {
            'NODE_ENV': 'development',
            'DEBUG': 'true'
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
      // Auto-select first environment if available
      if (mockEnvironments.length > 0 && !selectedEnvironment) {
        setSelectedEnvironment(mockEnvironments[0])
      }
    } catch (error) {
      console.error('Failed to load environments:', error)
      setEnvironments([])
    }
  }

  const handleStartChat = async () => {
    if (!selectedAgent || !selectedEnvironment) return
    
    // Validate that we have the required data
    if (!selectedAgent.config_filename) {
      console.error('Selected agent is missing config filename')
      return
    }

    setIsLoading(true)
    try {
      // Use the AppLayout's session creation handler to properly manage state
      await onCreateSession(selectedAgent.config_filename)
      
      onClose()
      
      // Reset selections
      setSelectedAgent(null)
      setSelectedEnvironment(null)
    } catch (error) {
      console.error('Failed to create chat session:', error)
      // TODO: Show user-friendly error message
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNewAgent = () => {
    onClose()
    onNavigate('agent-creator')
  }

  const handleCreateNewEnvironment = () => {
    onClose()
    onNavigate('environments')
  }

  const canStartChat = selectedAgent !== null && selectedEnvironment !== null

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
          {agents.length === 0 && environments.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Agents or Environments Available</h3>
              <p className="text-muted-foreground mb-4">
                You need to create at least one agent and one environment before starting a chat.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={handleCreateNewAgent}>
                  <Bot className="h-4 w-4 mr-2" />
                  Create Agent
                </Button>
                <Button onClick={handleCreateNewEnvironment} variant="outline">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  Create Environment
                </Button>
              </div>
            </div>
          ) : (
            <>
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
                      onClick={handleCreateNewAgent}
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
                                <span>Model: {agent.model || 'Unknown'}</span>
                                <span>•</span>
                                <span>Provider: {agent.provider || 'Unknown'}</span>
                                <span>•</span>
                                <span>Tools: {agent.toolset_display || 'None'}</span>
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
                      onClick={handleCreateNewEnvironment}
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
                                <span>Dir: {env.working_directory || 'Unknown'}</span>
                                <span>•</span>
                                <span>Vars: {Object.keys(env.environment_variables || {}).length}</span>
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
                        <div className="text-sm text-muted-foreground italic">No environment selected</div>
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
                  disabled={!canStartChat || isLoading}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isLoading ? 'Creating...' : 'Start Chat'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}