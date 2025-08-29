import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Bot, User, Terminal, Brain, Wrench, Search, FileText } from 'lucide-react'
import { Message } from '@/types'
import { ToolCallDisplay } from '@/components/ToolCallDisplay'
import ReactMarkdown from 'react-markdown'

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading: boolean
  onConfirm?: (confirmation: 'approve' | 'approve-session' | 'reject') => void
  onToolApprove?: (toolId: string, approval: 'approve' | 'approve-session' | 'reject') => void
}

export function ChatInterface({ messages, onSendMessage, isLoading, onConfirm, onToolApprove }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation with your agent</p>
          </div>
        )}
        
          {messages.filter(message => {
          // Filter out tool messages since we handle them separately
          if (message.role === 'tool') return false
          return true
        }).flatMap((message) => {
          // For assistant messages, create separate bubbles for tool calls and content
          if (message.role === 'assistant') {
            const bubbles = []
            
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
            
            // Add final response bubble if there's content
            const contentStr = Array.isArray(message.content) ? message.content.join('\n') : message.content
            if (contentStr && contentStr.trim()) {
              bubbles.push({
                ...message,
                id: `${message.id}-content`,
                pendingTools: [],
                completedTools: [],
                isToolBubble: false
              })
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

                if (message.role === 'assistant') {
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
                        <div className="prose prose-sm max-w-none dark:prose-invert chat-message-prose">
                          <ReactMarkdown>{contentStr}</ReactMarkdown>
                        </div>
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