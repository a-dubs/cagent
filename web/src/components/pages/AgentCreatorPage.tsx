import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Bot, Wand2, FileText, Settings, ArrowLeft } from 'lucide-react'
import { AgentCreatorForm } from '@/components/AgentCreatorForm'
import { AgentTemplates } from '@/components/AgentTemplates'
import { AgentAssistant } from '@/components/AgentAssistant'
import { useAppContext } from '@/hooks/useAppContext'

export function AgentCreatorPage() {
  const { handleNavigate } = useAppContext()
  const [activeTab, setActiveTab] = useState('form')

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => handleNavigate('setups')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Wand2 className="h-6 w-6 text-primary" />
                </div>
                Create New Agent
              </h1>
              <p className="text-muted-foreground mt-2">
                Build intelligent agents with custom capabilities, models, and toolsets - no YAML required
              </p>
            </div>
          </div>

          {/* Tabs for different creation methods */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="form" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Form Builder
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="assistant" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                AI Assistant
              </TabsTrigger>
            </TabsList>

            <TabsContent value="form" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Agent Configuration Form
                  </CardTitle>
                  <CardDescription>
                    Configure your agent step-by-step using our intuitive form interface
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AgentCreatorForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Agent Templates
                  </CardTitle>
                  <CardDescription>
                    Start with pre-built templates for common use cases and customize as needed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AgentTemplates />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assistant" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI-Powered Agent Creation
                  </CardTitle>
                  <CardDescription>
                    Describe what you want your agent to do, and our AI will help you build it
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AgentAssistant />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}