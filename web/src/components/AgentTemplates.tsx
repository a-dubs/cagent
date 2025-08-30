import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Code, FileText, Database, Globe, Bot, Terminal, Zap, Users, BookOpen, X } from 'lucide-react'
import { AgentConfigGenerator } from '@/components/AgentConfigGenerator'

interface AgentTemplate {
  id: string
  name: string
  description: string
  longDescription: string
  icon: React.ComponentType<any>
  category: string
  toolsets: string[]
  instruction: string
  model: string
  provider: string
  popularity: number
}

const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: 'code-assistant',
    name: 'Code Assistant',
    description: 'Help with coding, debugging, and software development',
    longDescription: 'A comprehensive coding assistant that can help with programming tasks, code review, debugging, and software architecture decisions.',
    icon: Code,
    category: 'Development',
    toolsets: ['shell', 'file'],
    instruction: `You are an expert software developer and coding assistant. Help users with:
- Writing clean, efficient code in various programming languages
- Debugging and troubleshooting issues
- Code reviews and best practices
- Architecture and design patterns
- Testing strategies and implementation

Always provide clear explanations and consider edge cases. When writing code, follow language-specific conventions and best practices.`,
    model: 'gpt-4',
    provider: 'openai',
    popularity: 95
  },
  {
    id: 'data-analyst',
    name: 'Data Analyst',
    description: 'Analyze data, create visualizations, and generate insights',
    longDescription: 'A data analysis specialist that can work with datasets, perform statistical analysis, create visualizations, and provide business insights.',
    icon: Database,
    category: 'Analytics',
    toolsets: ['file', 'database'],
    instruction: `You are a skilled data analyst and statistician. Help users with:
- Data cleaning and preprocessing
- Statistical analysis and hypothesis testing
- Creating visualizations and charts
- Identifying patterns and trends
- Generating actionable business insights

Always explain your methodology and provide context for your findings. Use appropriate statistical techniques and visualizations.`,
    model: 'claude-3-sonnet',
    provider: 'anthropic',
    popularity: 88
  },
  {
    id: 'web-researcher',
    name: 'Web Researcher',
    description: 'Research topics online and compile comprehensive reports',
    longDescription: 'A research specialist that can browse the web, gather information from multiple sources, and compile comprehensive reports on any topic.',
    icon: Globe,
    category: 'Research',
    toolsets: ['web', 'file'],
    instruction: `You are a thorough web researcher and information analyst. Help users with:
- Researching topics across multiple reliable sources
- Fact-checking and source verification
- Compiling comprehensive reports and summaries
- Identifying trends and emerging topics
- Finding specific information and data points

Always cite your sources and evaluate information credibility. Present findings in a clear, organized manner.`,
    model: 'gpt-4-turbo',
    provider: 'openai',
    popularity: 82
  },
  {
    id: 'devops-engineer',
    name: 'DevOps Engineer',
    description: 'Manage infrastructure, deployments, and automation',
    longDescription: 'A DevOps specialist that can help with infrastructure management, CI/CD pipelines, containerization, and deployment automation.',
    icon: Terminal,
    category: 'Operations',
    toolsets: ['shell', 'file'],
    instruction: `You are an experienced DevOps engineer and infrastructure specialist. Help users with:
- Setting up and managing CI/CD pipelines
- Container orchestration with Docker and Kubernetes
- Infrastructure as Code (Terraform, CloudFormation)
- Monitoring and logging solutions
- Automation scripts and deployment strategies

Focus on best practices, security, and scalability. Provide step-by-step guidance for complex setups.`,
    model: 'claude-3-opus',
    provider: 'anthropic',
    popularity: 76
  },
  {
    id: 'content-writer',
    name: 'Content Writer',
    description: 'Create engaging content, documentation, and marketing copy',
    longDescription: 'A versatile content creator that can write technical documentation, marketing copy, blog posts, and various forms of written content.',
    icon: FileText,
    category: 'Content',
    toolsets: ['file', 'web'],
    instruction: `You are a skilled content writer and technical communicator. Help users with:
- Writing clear, engaging technical documentation
- Creating marketing copy and promotional content
- Developing blog posts and articles
- Editing and improving existing content
- Adapting tone and style for different audiences

Always consider the target audience and purpose. Use clear, concise language and proper formatting.`,
    model: 'gpt-4',
    provider: 'openai',
    popularity: 71
  },
  {
    id: 'project-manager',
    name: 'Project Manager',
    description: 'Plan projects, manage tasks, and coordinate workflows',
    longDescription: 'A project management assistant that can help with planning, task management, timeline creation, and team coordination.',
    icon: Users,
    category: 'Management',
    toolsets: ['file'],
    instruction: `You are an experienced project manager and workflow optimizer. Help users with:
- Creating project plans and timelines
- Breaking down complex tasks into manageable steps
- Risk assessment and mitigation strategies
- Resource allocation and scheduling
- Team coordination and communication

Focus on practical, actionable advice. Use established project management methodologies when appropriate.`,
    model: 'claude-3-sonnet',
    provider: 'anthropic',
    popularity: 68
  }
]

const CATEGORIES = ['All', 'Development', 'Analytics', 'Research', 'Operations', 'Content', 'Management']

export function AgentTemplates() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null)

  const filteredTemplates = selectedCategory === 'All' 
    ? AGENT_TEMPLATES 
    : AGENT_TEMPLATES.filter(template => template.category === selectedCategory)

  const handleUseTemplate = (template: AgentTemplate) => {
    // Navigate to form builder with template data pre-filled
    const templateData = {
      name: template.name,
      description: template.description,
      instruction: template.instruction,
      model: template.model,
      provider: template.provider,
      toolsets: template.toolsets,
      workingDirectory: '/tmp',
      environmentVariables: {}
    }
    
    // Pass template data via URL state
    navigate('/agents/create', { 
      state: { 
        templateData,
        activeTab: 'form'
      } 
    })
  }

  const handleCreateDirectly = async (template: AgentTemplate) => {
    try {
      // Create agent configuration directly from template
      const formData = {
        name: template.name,
        description: template.description,
        instruction: template.instruction,
        model: template.model,
        provider: template.provider,
        temperature: 0.7,
        maxTokens: 4096,
        toolsets: template.toolsets,
        workingDirectory: '/tmp',
        environmentVariables: {},
        addDate: true
      }
      
      const config = AgentConfigGenerator.generateConfig(formData)
      const yaml = AgentConfigGenerator.generateYAML(config)
      
      // Auto-download the YAML file
      const blob = new Blob([yaml], { type: 'text/yaml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${template.name.toLowerCase().replace(/\s+/g, '-')}.yaml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      alert(`Agent "${template.name}" created successfully! The configuration file has been downloaded.`)
      setSelectedTemplate(null)
    } catch (error) {
      console.error('Failed to create agent from template:', error)
      alert('Failed to create agent. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates
          .sort((a, b) => b.popularity - a.popularity)
          .map(template => {
            const Icon = template.icon
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3" />
                      {template.popularity}%
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm">
                    {template.description}
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Model: {template.model}</div>
                    <div className="flex flex-wrap gap-1">
                      {template.toolsets.map(toolset => (
                        <Badge key={toolset} variant="outline" className="text-xs">
                          {toolset}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedTemplate(template)}
                      className="flex-1"
                    >
                      <BookOpen className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1"
                    >
                      <Bot className="h-4 w-4 mr-1" />
                      Customize
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
      </div>

      {/* Template Preview Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <selectedTemplate.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{selectedTemplate.name}</CardTitle>
                    <Badge variant="secondary" className="mt-1">
                      {selectedTemplate.category}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTemplate(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">{selectedTemplate.longDescription}</p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">System Instruction</h4>
                <div className="p-3 bg-muted rounded text-sm font-mono whitespace-pre-wrap">
                  {selectedTemplate.instruction}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Model</h4>
                  <Badge>{selectedTemplate.model}</Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Toolsets</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTemplate.toolsets.map(toolset => (
                      <Badge key={toolset} variant="outline">
                        {toolset}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              
                                <div className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedTemplate(null)}
                    >
                      Close
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        handleUseTemplate(selectedTemplate)
                        setSelectedTemplate(null)
                      }}
                      className="flex-1"
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      Customize Template
                    </Button>
                    <Button 
                      onClick={() => handleCreateDirectly(selectedTemplate)}
                      className="flex-1"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Use As-Is
                    </Button>
                  </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}