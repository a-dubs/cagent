import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Edit, Trash, BotIcon } from 'lucide-react'
import { AgentSetup } from '@/types'
import { agentSetupApi, apiClient, customAgentPathApi, directoryApi } from '@/lib/api'

interface AgentSetupManagerProps {
  onSetupSelect: (setup: AgentSetup) => void
  children?: React.ReactNode
}

export function AgentSetupManager({ onSetupSelect, children }: AgentSetupManagerProps) {
  const [setups, setSetups] = useState<AgentSetup[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingSetup, setEditingSetup] = useState<AgentSetup | null>(null)
  const [formData, setFormData] = useState<Partial<AgentSetup>>({
    name: '',
    description: '',
    agent_config_path: '',
    working_directory: '',
    environment_variables: {}
  })

  // Available agent configs
  const [availableConfigs, setAvailableConfigs] = useState<{ name: string; path: string; description?: string }[]>([])
  const [workingDirError, setWorkingDirError] = useState<string>('')
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    loadAgentSetups()
    loadAvailableConfigs()
    // Set default working directory to ~ (user home)
    setFormData(prev => ({ ...prev, working_directory: '~' }))
  }, [])

  const loadAvailableConfigs = async () => {
    try {
      // Load both uploaded custom configs and default agents
      const [customConfigs, defaultAgents] = await Promise.all([
        customAgentPathApi.getCustomAgentPaths().catch(() => []),
        apiClient.get<{ name: string; description: string }[]>('/agents').catch(() => [])
      ])
      
      const allConfigs = [
        // Uploaded configs first, more prominent
        ...(customConfigs || []).map(config => ({
          name: `📁 ${config.name}`,
          path: config.path,
          description: config.description || 'Uploaded configuration'
        })),
        // Add separator if both exist
        ...((customConfigs?.length > 0 && defaultAgents?.length > 0) ? [{
          name: '────────────────────',
          path: '__separator__',
          description: ''
        }] : []),
        // Default examples after separator
        ...(defaultAgents || []).map(agent => ({
          name: `⚙️ ${agent.name} (example)`,
          path: agent.name,
          description: agent.description || 'Example configuration'
        }))
      ]
      
      setAvailableConfigs(allConfigs)
    } catch (error) {
      console.error('Failed to load available configs:', error)
      setAvailableConfigs([])
    }
  }

  const loadAgentSetups = async () => {
    try {
      const data = await agentSetupApi.getAgentSetups()
      setSetups(data || [])
    } catch (error) {
      console.error('Failed to load agent setups:', error)
      setSetups([])
    }
  }

  const openCreateDialog = () => {
    setEditingSetup(null)
    setFormData({
      name: '',
      description: '',
      agent_config_path: '',
      working_directory: '~',
      environment_variables: {}
    })
    setWorkingDirError('')
    setIsOpen(true)
  }

  const openEditDialog = (setup: AgentSetup) => {
    setEditingSetup(setup)
    setFormData(setup)
    setWorkingDirError('')
    setIsOpen(true)
  }

  const handleSave = async () => {
    try {
      // Validate form before saving
      if (!formData.name?.trim()) {
        alert('Please enter a name for the agent setup')
        return
      }
      
      if (!formData.agent_config_path) {
        alert('Please select an agent configuration')
        return
      }
      
      if (!formData.working_directory?.trim()) {
        alert('Please enter a working directory')
        return
      }
      
      // Validate working directory
      const isValidDirectory = await validateWorkingDirectory(formData.working_directory)
      if (!isValidDirectory) {
        alert(`Invalid working directory: ${workingDirError}`)
        return
      }
      
      // If all validation passes, save the setup
      if (editingSetup) {
        await agentSetupApi.updateAgentSetup(editingSetup.id!, formData as AgentSetup)
      } else {
        await agentSetupApi.createAgentSetup(formData as AgentSetup)
      }
      setIsOpen(false)
      loadAgentSetups()
    } catch (error) {
      console.error('Failed to save agent setup:', error)
      alert('Failed to save agent setup. Please check your inputs and try again.')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this agent setup?')) {
      try {
        await agentSetupApi.deleteAgentSetup(id)
        await loadAgentSetups()
      } catch (error) {
        console.error('Failed to delete agent setup:', error)
      }
    }
  }

  const validateWorkingDirectory = async (path: string) => {
    if (!path.trim()) {
      setWorkingDirError('Working directory is required')
      return false
    }
    
    // Validate path format
    if (!path.startsWith('/') && !path.startsWith('~')) {
      setWorkingDirError('Path must be absolute (start with /) or use ~ for home directory')
      return false
    }
    
    setIsValidating(true)
    try {
      // Call backend to validate directory exists
      await directoryApi.browseDirectories(path)
      setWorkingDirError('')
      return true
    } catch (error) {
      setWorkingDirError('Directory does not exist or is not accessible')
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const handleWorkingDirBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    validateWorkingDirectory(e.target.value)
  }

  const handleEnvVarChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      environment_variables: {
        ...prev.environment_variables,
        [key]: value
      }
    }))
  }

  const addEnvVar = () => {
    const key = prompt('Environment variable name:')
    if (key) {
      handleEnvVarChange(key, '')
    }
  }

  const removeEnvVar = (key: string) => {
    setFormData(prev => {
      const newEnvVars = { ...prev.environment_variables }
      delete newEnvVars[key]
      return {
        ...prev,
        environment_variables: newEnvVars
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Agent Setups</h2>
        <Button onClick={openCreateDialog} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Setup
        </Button>
      </div>

      <div className="space-y-2">
        {setups.map((setup) => (
          <div key={setup.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <h3 className="font-medium">{setup.name}</h3>
              <p className="text-sm text-muted-foreground">{setup.description}</p>
              <div className="text-xs text-muted-foreground mt-1">
                Agent: {setup.agent_config_path}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Working Dir: {setup.working_directory}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSetupSelect(setup)}
              >
                <BotIcon className="h-4 w-4 mr-1" />
                Use
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => openEditDialog(setup)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(setup.id!)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {children && (
        <Dialog>
          <DialogTrigger asChild>
            {children}
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agent Setup Manager</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {setups.map((setup) => (
                <div key={setup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{setup.name}</h3>
                    <p className="text-sm text-muted-foreground">{setup.description}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onSetupSelect(setup)
                      setIsOpen(false)
                    }}
                  >
                    Select
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingSetup ? 'Edit Agent Setup' : 'Create Agent Setup'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Agent Setup"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description of this agent setup"
              />
            </div>

            <div>
              <Label htmlFor="agent_config_path">Agent Configuration</Label>
              <select
                id="agent_config_path"
                value={formData.agent_config_path || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, agent_config_path: e.target.value }))}
                className="w-full p-2 border border-input rounded-md bg-background"
              >
                <option value="">Select an agent configuration...</option>
                {availableConfigs.map((config) => (
                  <option 
                    key={config.path} 
                    value={config.path}
                    disabled={config.path === '__separator__'}
                    className={config.path === '__separator__' ? 'text-gray-400 font-normal' : ''}
                  >
                    {config.name} {config.description && `- ${config.description}`}
                  </option>
                ))}
              </select>
              <div className="text-xs text-muted-foreground mt-1">
                Choose from uploaded configs (📁) or example agents (⚙️)
              </div>
            </div>

            <div>
              <Label htmlFor="working_directory">Working Directory</Label>
              <div className="relative">
                <Input
                  id="working_directory"
                  value={formData.working_directory || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, working_directory: e.target.value }))}
                  onBlur={handleWorkingDirBlur}
                  placeholder="~/projects/my-agent or /absolute/path"
                  className={workingDirError ? 'border-red-500' : ''}
                />
                {isValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              {workingDirError && (
                <div className="text-xs text-red-500 mt-1">{workingDirError}</div>
              )}
              <div className="text-xs text-muted-foreground mt-1">
                Directory where the agent will execute (use ~ for home directory)
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Environment Variables</Label>
                <Button type="button" size="sm" variant="outline" onClick={addEnvVar}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              <div className="space-y-2 mt-2">
                {Object.entries(formData.environment_variables || {}).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <Input
                      value={key}
                      disabled
                      className="w-1/3"
                    />
                    <Input
                      value={value}
                      onChange={(e) => handleEnvVarChange(key, e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeEnvVar(key)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isValidating || !!workingDirError}
              >
                {isValidating ? 'Validating...' : editingSetup ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </div>
  )
}
