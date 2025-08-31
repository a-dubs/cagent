
import { Button } from '@/components/ui/button'
import { AgentConfigurationManager } from '@/components/AgentConfigurationManager'
import { useAppContext } from '@/hooks/useAppContext'
import { Plus, Settings } from 'lucide-react'

export function AgentSetupsPage() {
  const { handleNavigate } = useAppContext()
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold mb-2">AI Agents</h1>
                <p className="text-muted-foreground">
                  Manage your AI agent configurations. Agents define the AI model, instructions, and capabilities.
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleNavigate('environments')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Manage Environments
                </Button>
                <Button 
                  onClick={() => handleNavigate('agent-creator')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Agent
                </Button>
              </div>
            </div>
          </div>
          
          <AgentConfigurationManager />
        </div>
      </div>
    </div>
  )
}
