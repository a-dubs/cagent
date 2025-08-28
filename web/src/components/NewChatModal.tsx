import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Bot, Play, Settings as SettingsIcon } from 'lucide-react'
import { AgentSetup } from '@/types'

interface NewChatModalProps {
  isOpen: boolean
  onClose: () => void
  agentSetups: AgentSetup[]
  onSetupSelect: (setup: AgentSetup) => void
  onCreateSetup: () => void
}

export function NewChatModal({ 
  isOpen, 
  onClose, 
  agentSetups, 
  onSetupSelect, 
  onCreateSetup 
}: NewChatModalProps) {
  const [selectedSetup, setSelectedSetup] = useState<AgentSetup | null>(null)

  const handleStartChat = () => {
    if (selectedSetup) {
      onSetupSelect(selectedSetup)
      onClose()
      setSelectedSetup(null)
    }
  }

  const handleCreateNew = () => {
    onCreateSetup()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Start New Chat
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {agentSetups.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Agent Setups Available</h3>
              <p className="text-muted-foreground mb-4">
                You need to create an agent setup before starting a chat.
              </p>
              <Button onClick={handleCreateNew}>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Create Agent Setup
              </Button>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-lg font-medium mb-3">Choose an Agent Setup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select which agent configuration you'd like to use for this chat session.
                </p>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {agentSetups.map((setup) => (
                  <div
                    key={setup.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedSetup?.id === setup.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedSetup(setup)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{setup.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {setup.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Working Dir: {setup.working_directory}</span>
                          <span>•</span>
                          <span>Env Vars: {Object.keys(setup.environment_variables || {}).length}</span>
                        </div>
                      </div>
                      {selectedSetup?.id === setup.id && (
                        <div className="ml-4">
                          <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" onClick={handleCreateNew}>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Create New Setup
                </Button>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleStartChat}
                    disabled={!selectedSetup}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Chat
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
