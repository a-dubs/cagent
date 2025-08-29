import { useState } from 'react'
import { ChevronDown, ChevronRight, Brain, CheckCircle, Clock } from 'lucide-react'

interface ThinkToolCall {
  id: string
  name: string
  thought: string
  thinking: {
    summary: string
    full: string
  }
  status: 'pending' | 'executing' | 'completed'
  timestamp: string
  duration?: number
}

interface ThinkToolCallViewProps {
  toolCall: ThinkToolCall
}

export function ThinkToolCallView({ toolCall }: ThinkToolCallViewProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusIcon = () => {
    switch (toolCall.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'executing':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Brain className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return ''
    return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`
  }

  return (
    <div className="border border-border/30 rounded-md bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30">
      {/* Header */}
      <div 
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <span className="font-medium text-sm text-purple-800 dark:text-purple-200">Thinking</span>
        <span className="text-sm text-muted-foreground flex-1 truncate ml-2">
          {toolCall.thinking.summary}
        </span>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          {toolCall.duration && (
            <span className="text-xs text-muted-foreground">
              {formatDuration(toolCall.duration)}
            </span>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-purple-200/50 dark:border-purple-800/50">
          {(() => {
            // Check if thought and thinking.full are identical (avoid duplication)
            const thoughtContent = toolCall.thought?.trim() || ''
            const thinkingContent = toolCall.thinking.full?.trim() || ''
            const areIdentical = thoughtContent === thinkingContent

            if (areIdentical && thoughtContent) {
              // Show only one section when they're identical
              return (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Thinking:</div>
                  <div className="bg-white/60 dark:bg-gray-800/60 rounded p-3 border border-purple-200/50 dark:border-purple-800/50 max-h-60 overflow-auto">
                    <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">
                      {thoughtContent}
                    </pre>
                  </div>
                </div>
              )
            } else {
              // Show both sections when they're different
              return (
                <>
                  {thoughtContent && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Thought:</div>
                      <div className="bg-white/60 dark:bg-gray-800/60 rounded p-2 border border-purple-200/50 dark:border-purple-800/50">
                        <span className="text-sm text-gray-700 dark:text-gray-300 italic">"{thoughtContent}"</span>
                      </div>
                    </div>
                  )}

                  {thinkingContent && (
                    <div>
                      <div className="text-xs font-medium text-muted-foreground mb-1">Thinking Process:</div>
                      <div className="bg-white/60 dark:bg-gray-800/60 rounded p-3 border border-purple-200/50 dark:border-purple-800/50 max-h-60 overflow-auto">
                        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">
                          {thinkingContent}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )
            }
          })()}

          {/* Status */}
          <div className="flex items-center gap-2 text-xs pt-2 border-t border-purple-200/50 dark:border-purple-800/50">
            {getStatusIcon()}
            <span className="text-muted-foreground">
              Status: <span className="text-foreground capitalize">{toolCall.status}</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
