import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'

import { Bot, Settings, FolderOpen, RefreshCw } from 'lucide-react'
import { AgentConfiguration, EnvironmentSetup, Session } from '@/types'

interface ChatConfigurationPanelProps {
  currentSession: Session | null
  currentAgent: AgentConfiguration | null
  currentEnvironment: EnvironmentSetup | null
  onAgentChange: (agent: AgentConfiguration) => void
  onEnvironmentChange: (environment: EnvironmentSetup) => void
}

export function ChatConfigurationPanel({
  currentSession: _currentSession,
  currentAgent,
  currentEnvironment,
  onAgentChange,
  onEnvironmentChange
}: ChatConfigurationPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<AgentConfiguration | null>(currentAgent)
  const [selectedEnvironment, setSelectedEnvironment] = useState<EnvironmentSetup | null>(currentEnvironment)

  // Mock data - replace with actual API calls
  const availableAgents: AgentConfiguration[] = [
    {
      id: 'code-assistant',
      name: 'Code Assistant',
      description: 'Expert software developer',
      config_filename: 'code-assistant.yaml',
      model: 'gpt-4',
      provider: 'openai',
      instruction: 'You are an expert software developer...',
      toolsets: ['shell', 'file']
    },
    {
      id: 'data-analyst',
      name: 'Data Analyst',
      description: 'Data analysis expert',
      config_filename: 'data-analyst.yaml',
      model: 'claude-3-sonnet',
      provider: 'anthropic',
      instruction: 'You are a skilled data analyst...',
      toolsets: ['file', 'database']
    }
  ]

  const availableEnvironments: EnvironmentSetup[] = [
    {
      id: 1,
      name: 'Default',
      description: 'Default environment',
      working_directory: '/tmp',
      environment_variables: {}
    },
    {
      id: 2,
      name: 'Development',
      description: 'Development environment',
      working_directory: '/workspace',
      environment_variables: { 'NODE_ENV': 'development' }
    }
  ]

  const handleApplyChanges = () => {
    if (selectedAgent && selectedAgent.id !== currentAgent?.id) {
      onAgentChange(selectedAgent)
    }
    if (selectedEnvironment && selectedEnvironment.id !== currentEnvironment?.id) {
      onEnvironmentChange(selectedEnvironment)
    }
    setIsOpen(false)
  }

  const handleOpen = () => {
    setSelectedAgent(currentAgent)
    setSelectedEnvironment(currentEnvironment)
    setIsOpen(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={handleOpen}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Change Config
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Change Chat Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Configuration */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-3">Current Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Agent:</span> {currentAgent?.name || 'None'}
              </div>
              <div>
                <span className="font-medium">Environment:</span> {currentEnvironment?.name || 'Default'}
              </div>
            </div>
          </div>

          {/* Agent Selection */}
          <div className="space-y-3">
            <h3 className="font-medium">Select Agent</h3>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {availableAgents.map((agent) => (
                <Card 
                  key={agent.id}
                  className={`cursor-pointer transition-colors ${
                    selectedAgent?.id === agent.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedAgent(agent)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Bot className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium text-sm">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">{agent.model}</div>
                        </div>
                      </div>
                      {selectedAgent?.id === agent.id && (
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Environment Selection */}
          <div className="space-y-3">
            <h3 className="font-medium">Select Environment</h3>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {availableEnvironments.map((env) => (
                <Card 
                  key={env.id}
                  className={`cursor-pointer transition-colors ${
                    selectedEnvironment?.id === env.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedEnvironment(env)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FolderOpen className="h-4 w-4 text-primary" />
                        <div>
                          <div className="font-medium text-sm">{env.name}</div>
                          <div className="text-xs text-muted-foreground">{env.working_directory}</div>
                        </div>
                      </div>
                      {selectedEnvironment?.id === env.id && (
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApplyChanges}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Apply Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}