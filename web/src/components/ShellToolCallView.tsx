import { useState } from 'react'
import { ChevronDown, ChevronRight, Terminal, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ShellToolCall {
  id: string
  name: string
  command: string
  output?: string
  isError?: boolean
  status: 'pending' | 'executing' | 'completed' | 'error'
  timestamp: string
  duration?: number
}

interface ShellToolCallViewProps {
  toolCall: ShellToolCall
  onApprove?: (toolId: string, approval: 'approve' | 'approve-session' | 'reject') => void
  isExpanded?: boolean
  isLiveSession?: boolean
}

export function ShellToolCallView({ toolCall, onApprove, isExpanded: propIsExpanded, isLiveSession = false }: ShellToolCallViewProps) {
  // For live sessions, use prop-controlled expansion. For past sessions, use local state (default collapsed)
  const [localIsExpanded, setLocalIsExpanded] = useState(false)
  const isExpanded = isLiveSession ? (propIsExpanded ?? false) : localIsExpanded

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'executing':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Terminal className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return ''
    return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`
  }

  return (
    <div className="border border-border/30 rounded-md bg-gray-900 text-gray-100 font-mono text-xs">
      {/* Header */}
      <div 
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-800 transition-colors border-b border-gray-700"
        onClick={() => {
          if (isLiveSession) {
            // In live sessions, expansion is controlled by parent, so we don't toggle
            return
          } else {
            // In past sessions, we control expansion locally
            setLocalIsExpanded(!localIsExpanded)
          }
        }}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
        <Terminal className="h-4 w-4 text-blue-400" />
        <span className="text-blue-400 font-semibold">$</span>
        <span className="text-gray-100 flex-1 truncate">{toolCall.command}</span>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {toolCall.duration && (
            <span className="text-xs text-gray-400">
              {formatDuration(toolCall.duration)}
            </span>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Command */}
          <div>
            <div className="text-xs text-gray-400 mb-1">Command:</div>
            <div className="bg-gray-800 rounded p-2 border border-gray-700">
              <span className="text-blue-400">$ </span>
              <span className="text-gray-100">{toolCall.command}</span>
            </div>
          </div>

          {/* Output */}
          {toolCall.output && (
            <div>
              <div className="text-xs text-gray-400 mb-1">Output:</div>
              <div className="bg-gray-800 rounded p-2 border border-gray-700 max-h-60 overflow-auto">
                <pre className="text-gray-100 whitespace-pre-wrap text-xs leading-relaxed font-mono">
                  {toolCall.output}
                </pre>
              </div>
            </div>
          )}

          {/* Status and actions */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-700">
            <div className="flex items-center gap-2 text-xs">
              {getStatusIcon()}
              <span className="text-gray-400">
                Status: <span className="text-gray-200 capitalize">{toolCall.status}</span>
              </span>
            </div>

            {/* Approval buttons for pending commands */}
            {toolCall.status === 'pending' && onApprove && (
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => onApprove(toolCall.id, 'approve')}
                  className="h-7 px-3 text-xs bg-green-600 hover:bg-green-700"
                >
                  Run
                </Button>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => onApprove(toolCall.id, 'approve-session')}
                  className="h-7 px-3 text-xs"
                >
                  Run All
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => onApprove(toolCall.id, 'reject')}
                  className="h-7 px-3 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}