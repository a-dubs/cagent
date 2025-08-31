import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Edit, Trash, Copy, Settings, FolderOpen, X } from 'lucide-react'
import { EnvironmentSetup } from '@/types'

interface EnvironmentSetupManagerProps {
  onSetupSelect?: (setup: EnvironmentSetup) => void
}

export function EnvironmentSetupManager({ onSetupSelect }: EnvironmentSetupManagerProps) {
  const [setups, setSetups] = useState<EnvironmentSetup[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [editingSetup, setEditingSetup] = useState<EnvironmentSetup | null>(null)
  const [formData, setFormData] = useState<Partial<EnvironmentSetup>>({
    name: '',
    description: '',
    working_directory: '/tmp',
    environment_variables: {}
  })
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')

  useEffect(() => {
    loadEnvironmentSetups()
  }, [])

  const loadEnvironmentSetups = async () => {
    try {
      // TODO: Replace with actual API call
      const mockSetups: EnvironmentSetup[] = [
        {
          id: 1,
          name: 'Default',
          description: 'Default environment with no special configuration',
          working_directory: '/tmp',
          environment_variables: {},
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          name: 'Development',
          description: 'Development environment with Node.js and Python tools',
          working_directory: '/workspace',
          environment_variables: {
            'NODE_ENV': 'development',
            'PYTHONPATH': '/workspace/scripts'
          },
          created_at: new Date().toISOString()
        }
      ]
      setSetups(mockSetups)
    } catch (error) {
      console.error('Failed to load environment setups:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const setupData = {
        ...formData,
        id: editingSetup?.id || Date.now(),
        created_at: editingSetup?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      } as EnvironmentSetup

      if (editingSetup) {
        setSetups(prev => prev.map(s => s.id === editingSetup.id ? setupData : s))
      } else {
        setSetups(prev => [...prev, setupData])
      }

      resetForm()
    } catch (error) {
      console.error('Failed to save environment setup:', error)
    }
  }

  const handleEdit = (setup: EnvironmentSetup) => {
    setEditingSetup(setup)
    setFormData(setup)
    setIsOpen(true)
  }

  const handleClone = (setup: EnvironmentSetup) => {
    setEditingSetup(null)
    setFormData({
      ...setup,
      name: `${setup.name} (Copy)`,
      id: undefined
    })
    setIsOpen(true)
  }

  const handleDelete = async (setupId: number) => {
    if (confirm('Are you sure you want to delete this environment setup?')) {
      setSetups(prev => prev.filter(s => s.id !== setupId))
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      working_directory: '/tmp',
      environment_variables: {}
    })
    setEditingSetup(null)
    setIsOpen(false)
    setNewEnvKey('')
    setNewEnvValue('')
  }

  const addEnvironmentVariable = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setFormData(prev => ({
        ...prev,
        environment_variables: {
          ...prev.environment_variables,
          [newEnvKey.trim()]: newEnvValue.trim()
        }
      }))
      setNewEnvKey('')
      setNewEnvValue('')
    }
  }

  const removeEnvironmentVariable = (key: string) => {
    setFormData(prev => {
      const newEnvVars = { ...prev.environment_variables }
      delete newEnvVars[key]
      return { ...prev, environment_variables: newEnvVars }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Environment Setups</h2>
          <p className="text-sm text-muted-foreground">
            Manage working directories and environment variables for your agents
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              New Environment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSetup ? 'Edit Environment Setup' : 'Create Environment Setup'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Development"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="working_directory">Working Directory *</Label>
                  <Input
                    id="working_directory"
                    value={formData.working_directory || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, working_directory: e.target.value }))}
                    placeholder="/tmp"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this environment"
                />
              </div>

              {/* Environment Variables */}
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
                {Object.entries(formData.environment_variables || {}).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(formData.environment_variables || {}).map(([key, value]) => (
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

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSetup ? 'Update' : 'Create'} Environment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Environment Setups List */}
      <div className="grid gap-4">
        {setups.map((setup) => (
          <Card key={setup.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    {setup.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {setup.description}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleClone(setup)}
                    title="Clone environment"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(setup)}
                    title="Edit environment"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {setup.id !== 1 && ( // Don't allow deleting default environment
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(setup.id!)}
                      title="Delete environment"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Working Directory:</span>
                  <div className="text-muted-foreground">{setup.working_directory}</div>
                </div>
                <div>
                  <span className="font-medium">Environment Variables:</span>
                  <div className="text-muted-foreground">
                    {Object.keys(setup.environment_variables).length} variables
                  </div>
                </div>
              </div>
              
              {Object.keys(setup.environment_variables).length > 0 && (
                <div>
                  <span className="font-medium text-sm">Variables:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {Object.keys(setup.environment_variables).map(key => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {onSetupSelect && (
                <div className="pt-2">
                  <Button 
                    onClick={() => onSetupSelect(setup)}
                    className="w-full"
                    size="sm"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Use This Environment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}