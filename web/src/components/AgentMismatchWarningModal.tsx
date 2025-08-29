import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface AgentMismatchWarningModalProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
  sessionTitle: string
  agentFilename: string
  fallbackSetupName: string
}

export function AgentMismatchWarningModal({
  isOpen,
  onClose,
  onProceed,
  sessionTitle,
  agentFilename,
  fallbackSetupName
}: AgentMismatchWarningModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            Agent Setup Mismatch Warning
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-orange-800 mb-2">
                  No Matching Agent Setup Found
                </h4>
                <p className="text-sm text-orange-700">
                  The session "<strong>{sessionTitle}</strong>" was created with agent 
                  "<strong>{agentFilename}</strong>", but no matching agent setup was found 
                  in your current configurations.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">What this means:</h5>
            <ul className="space-y-2 text-sm text-gray-600 ml-4">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0 mt-2"></span>
                The original agent configuration may have been moved, deleted, or renamed
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0 mt-2"></span>
                A temporary fallback setup "<strong>{fallbackSetupName}</strong>" will be used
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0 mt-2"></span>
                The agent may not work as expected due to missing configuration
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">Recommended actions:</h5>
            <ol className="space-y-2 text-sm text-gray-600 ml-4">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex-shrink-0 text-xs font-medium flex items-center justify-center">1</span>
                Check if the agent configuration file still exists at: <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{agentFilename}</code>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex-shrink-0 text-xs font-medium flex items-center justify-center">2</span>
                Create a new agent setup in the Agent Setups page that points to the correct configuration
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex-shrink-0 text-xs font-medium flex items-center justify-center">3</span>
                Or choose a different session that uses an available agent setup
              </li>
            </ol>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={onProceed} className="bg-orange-600 hover:bg-orange-700">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Proceed with Fallback
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
