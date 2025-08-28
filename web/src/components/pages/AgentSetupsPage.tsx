
import { AgentSetupManager } from '@/components/AgentSetupManager'
import { AgentSetup } from '@/types'

interface AgentSetupsPageProps {
  onSetupSelect: (setup: AgentSetup) => void
}

export function AgentSetupsPage({ onSetupSelect }: AgentSetupsPageProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">Agent Setups</h1>
            <p className="text-muted-foreground">
              Create and manage your agent configurations, working directories, and environment variables.
            </p>
          </div>
          
          <AgentSetupManager onSetupSelect={onSetupSelect} />
        </div>
      </div>
    </div>
  )
}
