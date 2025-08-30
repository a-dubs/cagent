import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Bot, User, Terminal, Brain, Wrench, Search, FileText } from 'lucide-react'
import { Message } from '@/types'
import { ToolCallDisplay } from '@/components/ToolCallDisplay'
import { ShellToolCallView } from '@/components/ShellToolCallView'
import { ThinkToolCallView } from '@/components/ThinkToolCallView'
import { EnhancedMarkdown } from '@/components/EnhancedMarkdown'
import { useTheme } from '@/hooks/useTheme'

// Interface for merged shell tool calls
interface MergedShellToolCall {
  id: string
  name: string
  command: string
  output?: string
  isError?: boolean
  status: 'pending' | 'executing' | 'completed' | 'error'
  timestamp: string
  duration?: number
}

// Function to process messages and convert shell and think tool calls to use specialized components
const processMessagesForSpecializedTools = (messages: Message[]): Message[] => {
  // First, build a map of tool outputs by tool call ID
  const toolOutputs = new Map<string, string>()
  
  messages.forEach(message => {
    if (message.toolCallID && message.toolOutput) {
      toolOutputs.set(message.toolCallID, message.toolOutput)
    }
  })

  // Build a map of think tool inputs to compare with outputs
  const thinkToolInputs = new Map<string, string>()
  
  messages.forEach(message => {
    if (Array.isArray(message.content)) {
      message.content.forEach((item: any) => {
        if (item.type === 'tool_use' && item.name === 'think' && item.input?.thought) {
          thinkToolInputs.set(item.id, item.input.thought)
        }
      })
    }
  })

  return messages.map(message => {
    // Check if this message has completed tools that are shell or think commands
    if (message.completedTools && message.completedTools.length > 0) {
      const shellTools: MergedShellToolCall[] = []
      const thinkTools: any[] = []
      const nonSpecializedTools: typeof message.completedTools = []

      message.completedTools.forEach(tool => {
        const isShellTool = tool.name === 'shell' || 
                           tool.name === 'run_terminal_cmd' || 
                           tool.name?.toLowerCase().includes('shell') ||
                           tool.name?.toLowerCase().includes('terminal')
        
        const isThinkTool = tool.name?.toLowerCase().includes('think')

        if (isShellTool) {
          // Parse the command from args
          let command = ''
          try {
            const parsedArgs = JSON.parse(tool.args || '{}')
            command = parsedArgs.cmd || parsedArgs.command || tool.args || ''
          } catch {
            command = tool.args || ''
          }

          // Get output from the tool outputs map or the tool itself
          const output = toolOutputs.get(tool.id) || tool.output

          shellTools.push({
            id: tool.id,
            name: tool.name,
            command: command,
            output: output,
            isError: false, // We don't have error info in CompletedToolCall
            status: 'completed',
            timestamp: tool.timestamp,
            duration: tool.duration
          })
        } else if (isThinkTool) {
          // Parse the thought from args
          let thought = ''
          let thinking = tool.thinking
          
          try {
            const parsedArgs = JSON.parse(tool.args || '{}')
            thought = parsedArgs.thought || parsedArgs.thinking || ''
            
            // If thinking is not available (stored sessions), create it from available data
            if (!thinking) {
              // Get the actual tool output (which may be different from the input thought)
              const toolOutput = toolOutputs.get(tool.id) || ''
              
              if (toolOutput) {
                // Remove "Thoughts:\n" prefix if present in output
                const cleanOutput = toolOutput.replace(/^Thoughts?:\s*\n?/i, '')
                
                thinking = {
                  summary: thought.length > 100 ? thought.substring(0, 100) + '...' : thought,
                  full: cleanOutput || thought // Use the actual output, fallback to thought
                }
              } else {
                // Fallback to using just the thought
                thinking = {
                  summary: thought.length > 100 ? thought.substring(0, 100) + '...' : thought,
                  full: thought
                }
              }
            }
          } catch {
            thought = tool.args || ''
            // Fallback thinking structure
            if (!thinking) {
              thinking = {
                summary: 'Thinking...',
                full: tool.args || 'No thinking data available'
              }
            }
          }

          // Create think tool if we have thinking data
          if (thinking) {
            thinkTools.push({
              id: tool.id,
              name: tool.name,
              thought: thought,
              thinking: thinking,
              status: 'completed',
              timestamp: tool.timestamp,
              duration: tool.duration
            })
          }
        } else {
          nonSpecializedTools.push(tool)
        }
      })

      // If we found specialized tools, create separate messages for them
      if (shellTools.length > 0 || thinkTools.length > 0) {
        const processedMessage = {
          ...message,
          completedTools: nonSpecializedTools.length > 0 ? nonSpecializedTools : undefined
        }

        // Create all specialized messages and sort them chronologically
        const allSpecializedTools = [
          ...shellTools.map(shellTool => ({ type: 'shell', tool: shellTool })),
          ...thinkTools.map(thinkTool => ({ type: 'think', tool: thinkTool }))
        ]

        // Sort by timestamp to maintain chronological order
        allSpecializedTools.sort((a, b) => {
          const timestampA = new Date(a.tool.timestamp).getTime()
          const timestampB = new Date(b.tool.timestamp).getTime()
          return timestampA - timestampB
        })

        // Create messages in chronological order
        const specializedMessages = allSpecializedTools.map(({ type, tool }) => {
          if (type === 'shell') {
            return {
              ...message,
              id: `${message.id}-shell-${tool.id}`,
              content: '',
              completedTools: undefined,
              pendingTools: undefined,
              shellToolCall: tool
            }
          } else {
            return {
              ...message,
              id: `${message.id}-think-${tool.id}`,
              content: '',
              completedTools: undefined,
              pendingTools: undefined,
              thinkToolCall: tool
            }
          }
        })

        // If there are non-specialized tools or content, include the original message
        // Put specialized tools first (chronologically), then the final response
        if (nonSpecializedTools.length > 0 || message.content) {
          return [...specializedMessages, processedMessage]
        } else {
          return specializedMessages
        }
      }
    }

    // Check pending tools as well
    if (message.pendingTools && message.pendingTools.length > 0) {
      const shellTools: MergedShellToolCall[] = []
      const nonShellTools: typeof message.pendingTools = []

      message.pendingTools.forEach(tool => {
        const isShellTool = tool.name === 'shell' || 
                           tool.name === 'run_terminal_cmd' || 
                           tool.name?.toLowerCase().includes('shell') ||
                           tool.name?.toLowerCase().includes('terminal')

        if (isShellTool) {
          // Parse the command from args
          let command = ''
          try {
            const parsedArgs = JSON.parse(tool.args || '{}')
            command = parsedArgs.cmd || parsedArgs.command || tool.args || ''
          } catch {
            command = tool.args || ''
          }

          shellTools.push({
            id: tool.id,
            name: tool.name,
            command: command,
            status: tool.status === 'pending_approval' ? 'pending' : 
                   tool.status === 'approved' ? 'executing' : 'pending',
            timestamp: tool.timestamp
          })
        } else {
          nonShellTools.push(tool)
        }
      })

      // If we found shell tools, create separate messages for them
      if (shellTools.length > 0) {
        const processedMessage = {
          ...message,
          pendingTools: nonShellTools.length > 0 ? nonShellTools : undefined
        }

        // Return an array with the original message (minus shell tools) and shell tool messages
        const shellMessages = shellTools.map(shellTool => ({
          ...message,
          id: `${message.id}-shell-${shellTool.id}`,
          content: '',
          completedTools: undefined,
          pendingTools: undefined,
          shellToolCall: shellTool
        }))

        // If there are non-shell tools or content, include the original message
        if (nonShellTools.length > 0 || message.content) {
          return [processedMessage, ...shellMessages]
        } else {
          return shellMessages
        }
      }
    }

    return [message]
  }).flat().filter(message => {
    // Filter out tool response messages that we've already merged into specialized tools
    if (message.toolCallID && message.tool?.name) {
      const toolName = message.tool.name.toLowerCase()
      
      // Always filter out shell tool results
      if (toolName === 'shell') {
        return false
      }
      
      // For think tools, only filter if the output is identical to the input
      if (toolName.includes('think')) {
        const toolInput = thinkToolInputs.get(message.toolCallID)
        const toolOutput = message.toolOutput
        
        if (toolInput && toolOutput) {
          // Remove "Thoughts:\n" prefix if present in output
          const cleanOutput = toolOutput.replace(/^Thoughts?:\s*\n?/i, '')
          
          // If they're identical (or nearly identical), filter out the duplicate
          if (cleanOutput.trim() === toolInput.trim()) {
            return false
          }
        }
        
        // If we can't determine or they're different, keep both
        return true
      }
    }
    return true
  })
}

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading: boolean
  onConfirm?: (confirmation: 'approve' | 'approve-session' | 'reject') => void
  onToolApprove?: (toolId: string, approval: 'approve' | 'approve-session' | 'reject') => void
  showStartSession?: boolean
  onStartSession?: () => void
  agentFilename?: string
}

export function ChatInterface({ messages, onSendMessage, isLoading, onConfirm, onToolApprove, showStartSession, onStartSession, agentFilename }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { isDark } = useTheme()

  // Process messages to convert shell and think tool calls to use specialized components
  const processedMessages = processMessagesForSpecializedTools(messages)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim())
      setInput('')
      resetTextareaHeight()
    }
  }

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '60px'
    }
  }

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '60px'
      const scrollHeight = textareaRef.current.scrollHeight
      const maxHeight = 200 // max-h-[200px] = 200px
      textareaRef.current.style.height = Math.min(scrollHeight, maxHeight) + 'px'
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const ToolIcon = ({ name }: { name?: string }) => {
    const n = (name || '').toLowerCase()
    if (n.includes('shell') || n.includes('sh') || n.includes('cmd') || n.includes('script')) return <Terminal className="h-4 w-4" />
    if (n.includes('think') || n.includes('reason')) return <Brain className="h-4 w-4" />
    if (n.includes('search') || n.includes('grep') || n.includes('find')) return <Search className="h-4 w-4" />
    if (n.includes('file') || n.includes('read')) return <FileText className="h-4 w-4" />
    return <Wrench className="h-4 w-4" />
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 max-h-full">
        {processedMessages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation with your agent</p>
          </div>
        )}
        
          {processedMessages.filter(message => {
          // Filter out tool messages since we handle them separately
          if (message.role === 'tool') return false
          return true
        }).flatMap((message) => {
          // For assistant messages, create unified bubbles when possible
          if (message.role === 'assistant') {
            const bubbles = []
            const contentStr = Array.isArray(message.content) ? message.content.join('\n') : message.content
            const hasContent = contentStr && contentStr.trim()
            const hasPendingTools = message.pendingTools && message.pendingTools.length > 0
            const hasCompletedTools = message.completedTools && message.completedTools.length > 0
            
            // Check if we can create a unified bubble (content + tools together)
            const canUnify = hasContent && (hasPendingTools || hasCompletedTools)
            
            if (canUnify) {
              // Create a single unified bubble with both content and tools
              bubbles.push({
                ...message,
                id: `${message.id}-unified`,
                isToolBubble: false,
                isUnifiedMessage: true // Flag to indicate this has both content and tools
              })
            } else {
              // Fall back to separate bubbles when no content or no tools
              
              // Add pending tool calls as separate bubbles
              if (message.pendingTools && message.pendingTools.length > 0) {
                message.pendingTools.forEach((tool) => {
                  bubbles.push({
                    ...message,
                    id: `${message.id}-pending-${tool.id}`,
                    content: '',
                    pendingTools: [tool],
                    completedTools: [],
                    isToolBubble: true
                  })
                })
              }
              
              // Add completed tool calls as separate bubbles
              if (message.completedTools && message.completedTools.length > 0) {
                message.completedTools.forEach((tool) => {
                  bubbles.push({
                    ...message,
                    id: `${message.id}-completed-${tool.id}`,
                    content: '',
                    pendingTools: [],
                    completedTools: [tool],
                    isToolBubble: true
                  })
                })
              }
              
              // Add final response bubble if there's content (and no tools to unify with)
              if (hasContent && !hasPendingTools && !hasCompletedTools) {
                bubbles.push({
                  ...message,
                  id: `${message.id}-content`,
                  pendingTools: [],
                  completedTools: [],
                  isToolBubble: false
                })
              }
            }
            
            return bubbles.length > 0 ? bubbles : [message]
          }
          
          return [message]
        }).map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {message.role !== 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                {message.role === 'assistant' ? (
                  <Bot className="h-4 w-4 text-primary-foreground" />
                ) : (
                  <span className="text-primary-foreground">
                    <ToolIcon name={message.tool?.name} />
                  </span>
                )}
              </div>
            )}
            
            <div
              className={`max-w-[70%] rounded-lg px-3 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : message.isToolBubble
                  ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {(() => {
                const contentStr = Array.isArray(message.content)
                  ? message.content.join('\n')
                  : message.content

                // Handle shell tool calls with special rendering
                if (message.shellToolCall) {
                  return (
                    <ShellToolCallView 
                      toolCall={message.shellToolCall}
                      onApprove={onToolApprove}
                    />
                  )
                }

                // Handle think tool calls with special rendering
                if (message.thinkToolCall) {
                  return (
                    <ThinkToolCallView 
                      toolCall={message.thinkToolCall}
                    />
                  )
                }

                if (message.role === 'assistant') {
                  // Check if this is a unified message (content + tools together)
                  if ((message as any).isUnifiedMessage) {
                    const hasTools = (message.pendingTools && message.pendingTools.length > 0) || 
                                     (message.completedTools && message.completedTools.length > 0)
                    
                    return (
                      <div className="space-y-3">
                        {/* Content first */}
                        {contentStr && contentStr.trim() && (
                          <EnhancedMarkdown isDark={isDark}>
                            {contentStr}
                          </EnhancedMarkdown>
                        )}
                        
                        {/* Tool calls below content */}
                        {hasTools && (
                          <ToolCallDisplay 
                            pendingTools={message.pendingTools}
                            completedTools={message.completedTools}
                            onApprove={onToolApprove}
                          />
                        )}
                      </div>
                    )
                  }
                  
                  // If this is a tool bubble, show only the tool call
                  if (message.isToolBubble) {
                    const hasTools = (message.pendingTools && message.pendingTools.length > 0) || 
                                     (message.completedTools && message.completedTools.length > 0)
                    if (hasTools) {
                      return (
                        <ToolCallDisplay 
                          pendingTools={message.pendingTools}
                          completedTools={message.completedTools}
                          onApprove={onToolApprove}
                        />
                      )
                    }
                  } else {
                    // This is the final response bubble, show only content
                    if (contentStr && contentStr.trim()) {
                      return (
                        <EnhancedMarkdown isDark={isDark}>
                          {contentStr}
                        </EnhancedMarkdown>
                      )
                    }
                  }
                }
                if (message.role === 'tool') {
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 font-semibold">
                        <ToolIcon name={message.tool?.name} />
                        <span>{message.tool?.name ? message.tool.name : 'Tool'}</span>
                      </div>
                      {message.tool?.args && (
                        <div className="text-xs opacity-70">
                          Args: <code className="break-words">{message.tool.args}</code>
                        </div>
                      )}
                      {message.thinking ? (
                        <details className="mt-1 p-2 border rounded">
                          <summary className="font-medium">Thinking: {message.thinking.summary}</summary>
                          <div className="mt-2 whitespace-pre-wrap text-sm opacity-90">{message.thinking.full}</div>
                        </details>
                      ) : null}
                      {message.toolOutput && (
                        <div className="mt-1">
                          <div className="text-xs font-medium mb-1 opacity-70">Output:</div>
                          <pre className="text-xs whitespace-pre-wrap bg-background/50 rounded p-2 max-h-80 overflow-auto">{message.toolOutput}</pre>
                        </div>
                      )}
                      {!message.toolOutput && !message.thinking && contentStr && (
                        <p className="whitespace-pre-wrap">{contentStr}</p>
                      )}
                    </div>
                  )
                }
                // system or others
                return <p className="whitespace-pre-wrap">{contentStr}</p>
              })()}
              
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/20">
                  <div className="text-xs opacity-70">
                    Used tools: {message.toolCalls.map(tc => tc.function.name).join(', ')}
                  </div>
                </div>
              )}

              {/* Confirmation UI for tool calls */}
              {message.confirmation && (
                <div className="mt-2 pt-2 border-t border-border/20 flex gap-2 items-center">
                  <div className="text-sm">This action requires confirmation:</div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => onConfirm && onConfirm('approve')}>Yes</Button>
                    <Button size="sm" onClick={() => onConfirm && onConfirm('approve-session')}>All</Button>
                    <Button size="sm" variant="destructive" onClick={() => onConfirm && onConfirm('reject')}>No</Button>
                  </div>
                </div>
              )}
              {/* For assistant messages we already render Markdown above; thinking for tools is handled in tool block */}
            </div>

            {message.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                <User className="h-4 w-4 text-secondary-foreground" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Start Session Button */}
      {showStartSession && (
        <div className="flex justify-center py-4 border-t border-b bg-muted/30">
          <div className="text-center space-y-3">
            <div className="text-sm text-muted-foreground">
              This session needs to be started to continue chatting
            </div>
            <Button 
              onClick={onStartSession}
              className="gap-2"
              size="lg"
            >
              <Bot className="h-4 w-4" />
              Start Session
              {agentFilename && (
                <span className="text-xs opacity-75">({agentFilename})</span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t bg-background p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="min-h-[60px] max-h-[200px] resize-none overflow-hidden"
            disabled={isLoading}
            style={{ height: '60px' }}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon" className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}