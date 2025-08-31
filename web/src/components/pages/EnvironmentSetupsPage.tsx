import { EnvironmentSetupManager } from '@/components/EnvironmentSetupManager'

export function EnvironmentSetupsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold mb-2">Environment Setups</h1>
            <p className="text-muted-foreground">
              Create and manage working environments with custom directories and environment variables.
              These can be used with any agent to provide the right runtime context.
            </p>
          </div>
          
          <EnvironmentSetupManager />
        </div>
      </div>
    </div>
  )
}