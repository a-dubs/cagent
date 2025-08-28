import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Send, Bot, User } from 'lucide-react'
import { Message } from '@/types'
import ReactMarkdown from 'react-markdown'

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (message: string) => void
  isLoading: boolean
}

export function ChatInterface({ messages, onSendMessage, isLoading }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Start a conversation with your agent</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === 'assistant' ? 'justify-start' : 'justify-end'
            }`}
          >
            {message.role === 'assistant' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.role === 'assistant'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
              
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/20">
                  <div className="text-xs opacity-70">
                    Used tools: {message.toolCalls.map(tc => tc.function.name).join(', ')}
                  </div>
                </div>
              )}
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
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={isLoading}
          />
          <Button type="submit" disabled={!input.trim() || isLoading} size="icon" className="self-end">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}