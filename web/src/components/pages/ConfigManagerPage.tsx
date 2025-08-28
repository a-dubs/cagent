
import { AgentConfigManager } from '@/components/AgentConfigManager'

export function ConfigManagerPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">Agent Config Manager</h1>
            <p className="text-muted-foreground">
              Upload and manage agent configuration files. These configs define your agents' capabilities, models, and toolsets.
            </p>
          </div>
          
          <AgentConfigManager />
        </div>
      </div>
    </div>
  )
}
