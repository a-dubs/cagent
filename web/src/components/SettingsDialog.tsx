import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Settings, Plus, Trash2 } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'

interface SettingsDialogProps {
  children?: React.ReactNode
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const { settings, updateSettings } = useSettings()
  const [isOpen, setIsOpen] = useState(false)
  const [tempSettings, setTempSettings] = useState(settings)
  const [newEnvKey, setNewEnvKey] = useState('')
  const [newEnvValue, setNewEnvValue] = useState('')

  const handleOpen = (open: boolean) => {
    if (open) {
      setTempSettings(settings)
    }
    setIsOpen(open)
  }

  const handleSave = () => {
    updateSettings(tempSettings)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempSettings(settings)
    setIsOpen(false)
  }

  const addEnvVar = () => {
    if (newEnvKey.trim() && newEnvValue.trim()) {
      setTempSettings(prev => ({
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

  const removeEnvVar = (key: string) => {
    setTempSettings(prev => {
      const newEnvVars = { ...prev.environmentVariables }
      delete newEnvVars[key]
      return {
        ...prev,
        environmentVariables: newEnvVars
      }
    })
  }

  const updateEnvVar = (key: string, value: string) => {
    setTempSettings(prev => ({
      ...prev,
      environmentVariables: {
        ...prev.environmentVariables,
        [key]: value
      }
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {children || <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6">
          {/* Agent Config Path */}
          <div className="grid gap-2">
            <Label htmlFor="agentConfigPath">Agent Configuration File</Label>
            <Input
              id="agentConfigPath"
              value={tempSettings.agentConfigPath}
              onChange={(e) => setTempSettings(prev => ({ ...prev, agentConfigPath: e.target.value }))}
              placeholder="Path to your agent configuration file (e.g., /path/to/agent.yaml)"
            />
            <p className="text-sm text-muted-foreground">
              Select the YAML configuration file for your agent
            </p>
          </div>

          {/* Working Directory */}
          <div className="grid gap-2">
            <Label htmlFor="workingDirectory">Working Directory</Label>
            <Input
              id="workingDirectory"
              value={tempSettings.workingDirectory}
              onChange={(e) => setTempSettings(prev => ({ ...prev, workingDirectory: e.target.value }))}
              placeholder="Working directory for agent operations"
            />
            <p className="text-sm text-muted-foreground">
              Directory where the agent will run commands and access files
            </p>
          </div>

          {/* Environment Variables */}
          <div className="grid gap-4">
            <Label>Environment Variables</Label>
            
            {/* Add new env var */}
            <div className="flex gap-2">
              <Input
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
                placeholder="Variable name"
                onKeyDown={(e) => e.key === 'Enter' && addEnvVar()}
              />
              <Input
                value={newEnvValue}
                onChange={(e) => setNewEnvValue(e.target.value)}
                placeholder="Variable value"
                onKeyDown={(e) => e.key === 'Enter' && addEnvVar()}
              />
              <Button onClick={addEnvVar} size="icon" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Existing env vars */}
            <div className="max-h-48 overflow-y-auto space-y-2">
              {Object.entries(tempSettings.environmentVariables).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <Input
                    value={key}
                    onChange={(e) => {
                      const newKey = e.target.value
                      if (newKey !== key) {
                        // Remove old key and add new key
                        const newEnvVars = { ...tempSettings.environmentVariables }
                        delete newEnvVars[key]
                        newEnvVars[newKey] = value
                        setTempSettings(prev => ({ ...prev, environmentVariables: newEnvVars }))
                      }
                    }}
                    className="font-mono text-sm"
                  />
                  <Input
                    value={value}
                    onChange={(e) => updateEnvVar(key, e.target.value)}
                    className="font-mono text-sm"
                  />
                  <Button 
                    onClick={() => removeEnvVar(key)} 
                    size="icon" 
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <p className="text-sm text-muted-foreground">
              Environment variables will be available to your agent during execution
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}