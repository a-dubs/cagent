import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, Save, Bot, Settings, Database, Terminal, FileText, Globe, Download, AlertCircle } from 'lucide-react'
import { AgentConfigGenerator } from '@/components/AgentConfigGenerator'

interface AgentFormData {
  name: string
  description: string
  instruction: string
  model: string
  provider: string
  temperature: number
  maxTokens: number
  workingDirectory: string
  environmentVariables: Record<string, string>
  toolsets: string[]
  addDate: boolean
}

const AVAILABLE_TOOLSETS = [
  { id: 'shell', name: 'Shell Commands', description: 'Execute shell commands and scripts', icon: Terminal },
  { id: 'file', name: 'File Operations', description: 'Read, write, and manage files', icon: FileText },
  { id: 'web', name: 'Web Browsing', description: 'Browse and scrape web content', icon: Globe },
  { id: 'database', name: 'Database Access', description: 'Query and manage databases', icon: Database },
]

const MODEL_PROVIDERS = [
  { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
  { id: 'anthropic', name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  { id: 'local', name: 'Local/Ollama', models: ['llama2', 'codellama', 'mistral'] },
]

interface AgentCreatorFormProps {
  templateData?: any
}

export function AgentCreatorForm({ templateData }: AgentCreatorFormProps) {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState<AgentFormData>({
    name: templateData?.name || '',
    description: templateData?.description || '',
    instruction: templateData?.instruction || '',
    model: templateData?.model || '',
    provider: templateData?.provider || '',
    temperature: 0.7,
    maxTokens: 4096,
    workingDirectory: templateData?.workingDirectory || '',
    environmentVariables: templateData?.environmentVariables || {},
    toolsets: templateData?.toolsets || [],
    addDate: true
  })

  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [generatedYAML, setGeneratedYAML] = useState<string>('')

  const handleInputChange = (field: keyof AgentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addEnvironmentVariable = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setFormData(prev => ({
        ...prev,
        environmentVariables: {
          ...prev.environmentVariables,
          [newEnvKey.trim()]: newEnvValue.trim()
        }
      }))
      setNewEnvKey('')
      setNewEnvValue('')
    }
  }

  const removeEnvironmentVariable = (key: string) => {
    setFormData(prev => {
      const newEnvVars = { ...prev.environmentVariables }
      delete newEnvVars[key]
      return { ...prev, environmentVariables: newEnvVars }
    })
  }

  const toggleToolset = (toolsetId: string) => {
    setFormData(prev => ({
      ...prev,
      toolsets: prev.toolsets.includes(toolsetId)
        ? prev.toolsets.filter(id => id !== toolsetId)
        : [...prev.toolsets, toolsetId]
    }))
  }

  const validateAndGenerateConfig = () => {
    const errors = AgentConfigGenerator.validateConfig(formData)
    setValidationErrors(errors)
    
    if (errors.length === 0) {
      const config = AgentConfigGenerator.generateConfig(formData)
      const yaml = AgentConfigGenerator.generateYAML(config)
      setGeneratedYAML(yaml)
    } else {
      setGeneratedYAML('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    validateAndGenerateConfig()
    const errors = AgentConfigGenerator.validateConfig(formData)
    
    if (errors.length > 0) {
      return
    }

    setIsSubmitting(true)

    try {
      // Generate the agent configuration
      const config = AgentConfigGenerator.generateConfig(formData)
      const yaml = AgentConfigGenerator.generateYAML(config)
      
      // Auto-download the YAML file
      const blob = new Blob([yaml], { type: 'text/yaml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${formData.name.toLowerCase().replace(/\s+/g, '-')}.yaml`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Show success message and redirect
      alert(`Agent "${formData.name}" created successfully! The configuration file has been downloaded.`)
      navigate('/agents')
    } catch (error) {
      console.error('Failed to create agent:', error)
      alert('Failed to create agent. Please check the form and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDownloadYAML = () => {
    if (!generatedYAML) return
    
    const blob = new Blob([generatedYAML], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${formData.name.toLowerCase().replace(/\s+/g, '-')}.yaml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const selectedProvider = MODEL_PROVIDERS.find(p => p.id === formData.provider)

  // Update form data when template data changes
  React.useEffect(() => {
    if (templateData) {
      setFormData({
        name: templateData.name || '',
        description: templateData.description || '',
        instruction: templateData.instruction || '',
        model: templateData.model || '',
        provider: templateData.provider || '',
        temperature: 0.7,
        maxTokens: 4096,
        workingDirectory: templateData.workingDirectory || '',
        environmentVariables: templateData.environmentVariables || {},
        toolsets: templateData.toolsets || [],
        addDate: true
      })
    }
  }, [templateData])

  // Auto-generate YAML preview when form changes
  React.useEffect(() => {
    if (formData.name && formData.instruction && formData.model && formData.provider) {
      validateAndGenerateConfig()
    }
  }, [formData])

  return (
    <div className="space-y-8">
      {/* Template Info */}
      {templateData && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-900 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Customizing Template: {templateData.name}
            </CardTitle>
            <CardDescription className="text-blue-700">
              You can modify any of the pre-filled values below to customize this template to your needs.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-red-900 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Validation Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-red-800">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Define the core identity and purpose of your agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g., Code Assistant"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Brief description of what this agent does"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="instruction">System Instruction *</Label>
            <Textarea
              id="instruction"
              value={formData.instruction}
              onChange={(e) => handleInputChange('instruction', e.target.value)}
              placeholder="Describe the agent's role, behavior, and how it should respond to users..."
              className="min-h-[120px]"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Model Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Model Configuration
          </CardTitle>
          <CardDescription>
            Choose the AI model and configure its parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <Select value={formData.provider} onValueChange={(value) => handleInputChange('provider', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_PROVIDERS.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Select 
                value={formData.model} 
                onValueChange={(value) => handleInputChange('model', value)}
                disabled={!formData.provider}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProvider?.models.map(model => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min="1"
                max="32000"
                value={formData.maxTokens}
                onChange={(e) => handleInputChange('maxTokens', parseInt(e.target.value))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toolsets */}
      <Card>
        <CardHeader>
          <CardTitle>Available Toolsets</CardTitle>
          <CardDescription>
            Select the tools and capabilities your agent should have access to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AVAILABLE_TOOLSETS.map(toolset => {
              const Icon = toolset.icon
              const isSelected = formData.toolsets.includes(toolset.id)
              
              return (
                <div
                  key={toolset.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleToolset(toolset.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{toolset.name}</h3>
                      <p className="text-sm text-muted-foreground">{toolset.description}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Environment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Configuration</CardTitle>
          <CardDescription>
            Set up the working directory and environment variables for your agent
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workingDirectory">Working Directory</Label>
            <Input
              id="workingDirectory"
              value={formData.workingDirectory}
              onChange={(e) => handleInputChange('workingDirectory', e.target.value)}
              placeholder="/tmp"
            />
          </div>
          
          <div className="space-y-4">
            <Label>Environment Variables</Label>
            
            {/* Add new environment variable */}
            <div className="flex gap-2">
              <Input
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
                placeholder="Variable name"
                className="flex-1"
              />
              <Input
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                placeholder="Variable value"
                className="flex-1"
              />
              <Button type="button" onClick={addEnvironmentVariable} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Display existing environment variables */}
            {Object.entries(formData.environmentVariables).length > 0 && (
              <div className="space-y-2">
                {Object.entries(formData.environmentVariables).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 p-2 bg-muted rounded">
                    <Badge variant="outline">{key}</Badge>
                    <span className="text-sm flex-1">{value}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnvironmentVariable(key)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* YAML Preview */}
      {generatedYAML && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Generated Configuration
                </CardTitle>
                <CardDescription>
                  Preview of the YAML configuration that will be created
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadYAML}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download YAML
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded p-4 font-mono text-sm overflow-x-auto">
              <pre>{generatedYAML}</pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => navigate('/agents')}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          disabled={isSubmitting || validationErrors.length > 0 || !formData.name || !formData.instruction}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Creating...' : 'Create & Download Agent'}
        </Button>
      </div>
      </form>
    </div>
  )
}