import { Button } from '@/components/ui/button'
import { MessageCircle, Bot, Upload, Play, Zap, Shield, Clock } from 'lucide-react'
import { useAppContext } from '@/hooks/useAppContext'
import { QuickStartGuide } from '@/components/QuickStartGuide'

export function HomePage() {
  const { agentSetups, handleAgentSetupSelect, handleNavigate } = useAppContext()
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-6xl mx-auto p-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <MessageCircle className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Welcome to cagent
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your intelligent agent platform for automating tasks, managing workflows, and building powerful AI-driven solutions.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Powerful Agents</h3>
            </div>
            <p className="text-muted-foreground">
              Create and configure intelligent agents with custom toolsets, models, and capabilities to automate complex workflows.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Secure & Isolated</h3>
            </div>
            <p className="text-muted-foreground">
              Each agent runs in its own secure environment with controlled access to system resources and custom working directories.
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Persistent Sessions</h3>
            </div>
            <p className="text-muted-foreground">
              All conversations and tool interactions are saved, allowing you to resume work exactly where you left off.
            </p>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="mb-8">
          <QuickStartGuide />
        </div>

        {/* Quick Actions */}
        <div className="bg-card border rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6">Get Started</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Agent Setups
              </h3>
              <p className="text-muted-foreground mb-4">
                Create and manage agent configurations with custom working directories, environment variables, and tool access.
              </p>
              <div className="space-y-2">
                <Button onClick={() => handleNavigate('agent-creator')} className="w-full">
                  <Bot className="h-4 w-4 mr-2" />
                  Create New Agent
                </Button>
                <Button onClick={() => handleNavigate('setups')} variant="outline" className="w-full">
                  Manage Existing Setups
                </Button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Configuration Files
              </h3>
              <p className="text-muted-foreground mb-4">
                Upload and organize agent configuration files that define models, toolsets, and behavior patterns.
              </p>
              <Button onClick={() => handleNavigate('configs')} variant="outline" className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Manage Configurations
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Setups */}
        {agentSetups.length > 0 && (
          <div className="bg-card border rounded-lg p-8">
            <h2 className="text-2xl font-semibold mb-6">Recent Agent Setups</h2>
            <div className="grid gap-4">
              {agentSetups.slice(0, 3).map((setup) => (
                <div
                  key={setup.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-medium">{setup.name}</h3>
                    <p className="text-sm text-muted-foreground">{setup.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Working Dir: {setup.working_directory}</span>
                      <span>•</span>
                      <span>Env Vars: {Object.keys(setup.environment_variables || {}).length}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleAgentSetupSelect(setup)}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Start Chat
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
