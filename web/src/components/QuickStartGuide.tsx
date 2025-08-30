import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot, Wand2, FileText, ArrowRight, CheckCircle } from 'lucide-react'
import { useAppContext } from '@/hooks/useAppContext'

export function QuickStartGuide() {
  const { handleNavigate } = useAppContext()

  const steps = [
    {
      id: 1,
      title: 'Choose Creation Method',
      description: 'Pick the best way to create your agent',
      options: [
        { name: 'AI Assistant', description: 'Describe what you want, AI creates it', icon: Bot, action: () => handleNavigate('agent-creator') },
        { name: 'Templates', description: 'Start with pre-built templates', icon: FileText, action: () => handleNavigate('agent-creator') },
        { name: 'Form Builder', description: 'Manual configuration', icon: Wand2, action: () => handleNavigate('agent-creator') }
      ]
    },
    {
      id: 2,
      title: 'Configure Your Agent',
      description: 'Set up capabilities and behavior',
      completed: false
    },
    {
      id: 3,
      title: 'Start Chatting',
      description: 'Begin using your custom agent',
      completed: false
    }
  ]

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <CheckCircle className="h-6 w-6" />
          Quick Start Guide
        </CardTitle>
        <CardDescription className="text-blue-700">
          Get started with creating your first custom agent in minutes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {steps.map((step) => (
          <div key={step.id} className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
                {step.id}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">{step.title}</h3>
              <p className="text-sm text-blue-700 mb-3">{step.description}</p>
              
              {step.options && (
                <div className="grid gap-2">
                  {step.options.map((option, optionIndex) => {
                    const Icon = option.icon
                    return (
                      <Button
                        key={optionIndex}
                        variant="outline"
                        className="justify-start h-auto p-3 bg-white/50 hover:bg-white border-blue-200 hover:border-blue-300"
                        onClick={option.action}
                      >
                        <Icon className="h-4 w-4 mr-3 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium text-blue-900">{option.name}</div>
                          <div className="text-xs text-blue-600">{option.description}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 ml-auto text-blue-500" />
                      </Button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <CheckCircle className="h-4 w-4" />
            <span>No YAML editing required • Visual interface • AI-powered assistance</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}