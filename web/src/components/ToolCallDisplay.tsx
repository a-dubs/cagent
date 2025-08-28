import { useState } from 'react'
import { ChevronDown, ChevronRight, Clock, CheckCircle, AlertCircle, Play, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PendingToolCall, CompletedToolCall } from '@/types'

interface ToolCallDisplayProps {
  pendingTools?: PendingToolCall[]
  completedTools?: CompletedToolCall[]
  onApprove?: (toolId: string, approval: 'approve' | 'approve-session' | 'reject') => void
}

export function ToolCallDisplay({ pendingTools = [], completedTools = [], onApprove }: ToolCallDisplayProps) {
  const [expandedTools, setExpandedTools] = useState<Set<string>>(new Set())
  
  const toggleExpanded = (toolId: string) => {
    const newExpanded = new Set(expandedTools)
    if (newExpanded.has(toolId)) {
      newExpanded.delete(toolId)
    } else {
      newExpanded.add(toolId)
    }
    setExpandedTools(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <Play className="h-4 w-4 text-blue-500" />
      case 'executing':
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return ''
    return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`
  }

  if (pendingTools.length === 0 && completedTools.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground mb-1">Tool Calls</div>
      
      {/* Pending Tools */}
      {pendingTools.map((tool) => {
        const isExpanded = expandedTools.has(tool.id)
        return (
          <div key={tool.id} className="border border-border/30 rounded-md bg-background/50">
            <div 
              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpanded(tool.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              {getStatusIcon(tool.status)}
              <span className="font-medium text-sm">{tool.name}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {tool.status === 'pending_approval' ? 'Awaiting approval' : 
                 tool.status === 'approved' ? 'Approved' : 'Executing...'}
              </span>
            </div>
            
            {isExpanded && (
              <div className="px-2 pb-2 space-y-2 border-t border-border/20">
                {tool.args && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Arguments:</div>
                    <pre className="text-xs bg-muted/30 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                      {tool.args}
                    </pre>
                  </div>
                )}
                
                {tool.status === 'pending_approval' && onApprove && (
                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => onApprove(tool.id, 'approve')}
                      className="h-7 px-3 text-xs"
                    >
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => onApprove(tool.id, 'approve-session')}
                      className="h-7 px-3 text-xs"
                    >
                      Approve All
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onApprove(tool.id, 'reject')}
                      className="h-7 px-3 text-xs"
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Completed Tools */}
      {completedTools.map((tool) => {
        const isExpanded = expandedTools.has(tool.id)
        return (
          <div key={tool.id} className="border border-border/30 rounded-md bg-background/50">
            <div 
              className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpanded(tool.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              {getStatusIcon('completed')}
              <span className="font-medium text-sm">{tool.name}</span>
              {tool.duration && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDuration(tool.duration)}
                </span>
              )}
            </div>
            
            {isExpanded && (
              <div className="px-2 pb-2 space-y-2 border-t border-border/20">
                {tool.args && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Arguments:</div>
                    <pre className="text-xs bg-muted/30 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                      {tool.args}
                    </pre>
                  </div>
                )}
                
                {tool.thinking && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Thinking:</div>
                    <details className="bg-muted/30 rounded">
                      <summary className="p-2 text-xs font-medium cursor-pointer hover:bg-muted/50">
                        {tool.thinking.summary}
                      </summary>
                      <div className="p-2 pt-0 text-xs whitespace-pre-wrap border-t border-border/20">
                        {tool.thinking.full}
                      </div>
                    </details>
                  </div>
                )}
                
                {tool.output && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Output:</div>
                    <pre className="text-xs bg-muted/30 rounded p-2 max-h-60 overflow-auto whitespace-pre-wrap">
                      {tool.output}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
