import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Upload, Trash, Star, StarOff, FileText } from 'lucide-react'
import { CustomAgentPath } from '@/types'
import { customAgentPathApi } from '@/lib/api'

interface AgentConfig extends CustomAgentPath {
  isFavorite?: boolean
  content?: string
}

interface AgentConfigManagerProps {
  children?: React.ReactNode
}

export function AgentConfigManager({ children }: AgentConfigManagerProps) {
  const [configs, setConfigs] = useState<AgentConfig[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [uploadFormData, setUploadFormData] = useState({
    name: '',
    description: '',
    path: ''
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      const data = await customAgentPathApi.getCustomAgentPaths()
      setConfigs((data || []).map(config => ({
        ...config,
        isFavorite: localStorage.getItem(`favorite-${config.id}`) === 'true'
      })))
    } catch (error) {
      console.error('Failed to load agent configs:', error)
      setConfigs([])
    }
  }

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Try to get the full path (works in Electron/desktop environments)
      const path = (file as any).path || file.name
      setUploadFormData(prev => ({ 
        ...prev, 
        path,
        name: prev.name || file.name.replace(/\.[^/.]+$/, '') // Remove file extension for name
      }))
      
      // Read file content for preview (optional)
      const reader = new FileReader()
      reader.onload = (e) => {
        // Could store this content for preview functionality
        const content = e.target?.result as string
        console.log('File content loaded:', content.length, 'characters')
      }
      reader.readAsText(file)
    }
    // Reset the input
    if (event.target) event.target.value = ''
  }

  const handleUpload = async () => {
    if (!uploadFormData.name.trim() || !uploadFormData.path.trim()) {
      alert('Please provide both name and file path')
      return
    }

    try {
      await customAgentPathApi.addCustomAgentPath({
        name: uploadFormData.name,
        description: uploadFormData.description,
        path: uploadFormData.path
      })
      
      setUploadFormData({ name: '', description: '', path: '' })
      setIsOpen(false)
      loadConfigs()
    } catch (error) {
      console.error('Failed to upload agent config:', error)
      alert('Failed to upload agent config')
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this agent configuration?')) {
      try {
        await customAgentPathApi.deleteCustomAgentPath(id)
        loadConfigs()
      } catch (error) {
        console.error('Failed to delete agent config:', error)
      }
    }
  }

  const toggleFavorite = (id: number) => {
    const config = configs.find(c => c.id === id)
    if (config) {
      const newFavoriteState = !config.isFavorite
      localStorage.setItem(`favorite-${id}`, newFavoriteState.toString())
      setConfigs(prev => prev.map(c => 
        c.id === id ? { ...c, isFavorite: newFavoriteState } : c
      ))
    }
  }

  // Sort configs with favorites first
  const sortedConfigs = [...configs].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1
    if (!a.isFavorite && b.isFavorite) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Agent Configurations</h2>
        <Button onClick={() => setIsOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Upload Config
        </Button>
      </div>

      <div className="space-y-2">
        {sortedConfigs.map((config) => (
          <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium">{config.name}</h3>
                {config.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
              </div>
              <p className="text-sm text-muted-foreground">{config.description}</p>
              <div className="text-xs text-muted-foreground mt-1">
                Path: {config.path}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => toggleFavorite(config.id!)}
                title={config.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                {config.isFavorite ? (
                  <StarOff className="h-4 w-4" />
                ) : (
                  <Star className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(config.id!)}
                title="Delete configuration"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        
        {configs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No agent configurations uploaded yet</p>
            <p className="text-sm">Upload your first agent config to get started</p>
          </div>
        )}
      </div>

      {children && (
        <Dialog>
          <DialogTrigger asChild>
            {children}
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agent Configuration Manager</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sortedConfigs.map((config) => (
                <div key={config.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">{config.name}</h3>
                      {config.isFavorite && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleFavorite(config.id!)}
                  >
                    {config.isFavorite ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  </Button>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Upload Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Agent Configuration</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="config_name">Configuration Name</Label>
              <Input
                id="config_name"
                value={uploadFormData.name}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Custom Agent"
              />
            </div>

            <div>
              <Label htmlFor="config_description">Description (Optional)</Label>
              <Textarea
                id="config_description"
                value={uploadFormData.description}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description of this agent configuration"
              />
            </div>

            <div>
              <Label htmlFor="config_file">Configuration File</Label>
              <div className="flex gap-2">
                <Input
                  id="config_file"
                  value={uploadFormData.path}
                  onChange={(e) => setUploadFormData(prev => ({ ...prev, path: e.target.value }))}
                  placeholder="/path/to/agent/config.yaml"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFileSelect}
                  title="Browse for agent config file"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Browse
                </Button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Select a YAML or JSON agent configuration file
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".yaml,.yml,.json"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload}>
                <Upload className="h-4 w-4 mr-1" />
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
