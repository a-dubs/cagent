import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bot, Edit, Trash, Download, Play } from 'lucide-react'
import { AgentConfiguration } from '@/types'

interface AgentConfigurationManagerProps {
  onAgentSelect?: (agent: AgentConfiguration) => void
}

export function AgentConfigurationManager({ onAgentSelect }: AgentConfigurationManagerProps) {
  const [agents, setAgents] = useState<AgentConfiguration[]>([])
  const navigate = useNavigate()

  useEffect(() => {
    loadAgentConfigurations()
  }, [])

  const loadAgentConfigurations = async () => {
    try {
      // TODO: Replace with actual API call to load uploaded agent configs
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
          temperature: 0.7,
          max_tokens: 4096,
          created_at: new Date().toISOString()
        },
        {
          id: 'data-analyst',
          name: 'Data Analyst',
          description: 'Specialized data analysis and visualization expert',
          config_filename: 'data-analyst.yaml',
          model: 'claude-3-sonnet',
          provider: 'anthropic',
          instruction: 'You are a skilled data analyst...',
          toolsets: ['file', 'database'],
          temperature: 0.5,
          max_tokens: 4096,
          created_at: new Date().toISOString()
        }
      ]
      setAgents(mockAgents)
    } catch (error) {
      console.error('Failed to load agent configurations:', error)
    }
  }

  const handleDelete = async (agentId: string) => {
    if (confirm('Are you sure you want to delete this agent configuration?')) {
      setAgents(prev => prev.filter(a => a.id !== agentId))
    }
  }

  const handleDownload = (agent: AgentConfiguration) => {
    // Generate and download the YAML file
    const yaml = `version: "1.0"

agents:
  ${agent.id}:
    model: ${agent.model}
    description: "${agent.description}"
    instruction: |
      ${agent.instruction.split('\n').map(line => `      ${line}`).join('\n')}
    toolsets:
${agent.toolsets.map(toolset => `      - type: ${toolset}`).join('\n')}

models:
  ${agent.model}:
    provider: ${agent.provider}
    model: ${agent.model}
    temperature: ${agent.temperature || 0.7}
    max_tokens: ${agent.max_tokens || 4096}`

    const blob = new Blob([yaml], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = agent.config_filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Agents List */}
      <div className="grid gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    {agent.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {agent.description}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDownload(agent)}
                    title="Download YAML"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => navigate('/agent-creator', { 
                      state: { 
                        editingAgent: {
                          name: agent.name,
                          path: agent.path || agent.config_filename,
                          description: agent.description
                        }
                      }
                    })}
                    title="Edit agent"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(agent.id!)}
                    title="Delete agent"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Model:</span>
                  <div className="text-muted-foreground">{agent.model}</div>
                </div>
                <div>
                  <span className="font-medium">Provider:</span>
                  <div className="text-muted-foreground">{agent.provider}</div>
                </div>
                <div>
                  <span className="font-medium">Toolsets:</span>
                  <div className="text-muted-foreground">{agent.toolsets.length} tools</div>
                </div>
              </div>
              
              <div>
                <span className="font-medium text-sm">Available Tools:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {agent.toolsets.map(toolset => (
                    <Badge key={toolset} variant="outline" className="text-xs">
                      {toolset}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {onAgentSelect && (
                <div className="pt-2">
                  <Button 
                    onClick={() => onAgentSelect(agent)}
                    className="w-full"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Use This Agent
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}