
import { Button } from '@/components/ui/button'
import { AgentSetupManager } from '@/components/AgentSetupManager'
import { useAppContext } from '@/hooks/useAppContext'
import { Plus } from 'lucide-react'

export function AgentSetupsPage() {
  const { handleAgentSetupSelect, handleNavigate } = useAppContext()
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold mb-2">Agent Setups</h1>
                <p className="text-muted-foreground">
                  Create and manage your agent configurations, working directories, and environment variables.
                </p>
              </div>
              <Button 
                onClick={() => handleNavigate('agent-creator')}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create Agent
              </Button>
            </div>
          </div>
          
          <AgentSetupManager onSetupSelect={handleAgentSetupSelect} />
        </div>
      </div>
    </div>
  )
}
