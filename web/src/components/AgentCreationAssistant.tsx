import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Bot, Send, User, Sparkles, CheckCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'


interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  agentConfig?: any
}

interface AgentCreationAssistantProps {
  editingAgent?: {
    name: string
    path: string
    description?: string
  }
}

export function AgentCreationAssistant({ editingAgent }: AgentCreationAssistantProps = {}) {
  const navigate = useNavigate()
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: editingAgent 
        ? `Hello! I'm here to help you modify the **${editingAgent.name}** agent.

**Current Agent:** \`${editingAgent.path}\`
${editingAgent.description ? `**Description:** ${editingAgent.description}` : ''}

Tell me what changes you'd like to make:
• Modify the agent's capabilities or behavior
• Add or remove tools and features  
• Change the model or provider
• Update instructions or constraints

I'll help you iterate and improve your agent configuration.`
        : `Hello! I'm your AI assistant for creating custom agents. I can help you design the perfect agent for your needs.

Tell me:
• What tasks should your agent handle?
• What tools or capabilities does it need?
• Any specific requirements or constraints?

I'll guide you through the process and generate a complete agent configuration.`,
      timestamp: new Date().toISOString()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Call the backend API to create or update an agent based on the user's description
      const apiPayload = editingAgent 
        ? {
            prompt: userMessage.content,
            existing_agent: editingAgent.name,
            mode: 'edit'
          }
        : {
            prompt: userMessage.content
          }
      
      const response = await apiClient.post<{path: string, out: string}>('/agents', apiPayload)

      const assistantResponse: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: editingAgent 
          ? `🎉 **Agent Updated Successfully!**

I've updated the **${editingAgent.name}** agent based on your requirements. Here are the details:

**Agent File:** \`${response.path}\`

**Update Output:**
\`\`\`
${response.out}
\`\`\`

Your agent has been successfully modified and is ready to use! You can now:

1. **Start a new chat** with the updated agent
2. **Make further modifications** if needed
3. **Test the changes** to see how they work

The agent list will be automatically refreshed when you open the new chat modal.

Would you like to make more changes or start testing the updated agent?`
          : `🎉 **Agent Created Successfully!**

I've created a custom agent based on your description. Here are the details:

**Agent File:** \`${response.path}\`

**Creation Output:**
\`\`\`
${response.out}
\`\`\`

Your new agent has been saved to your custom agents directory and is ready to use! You can now:

1. **Start a new chat** with this agent from the main interface
2. **Edit the configuration** if you want to make adjustments  
3. **Share or export** the agent for others to use

The agent list will be automatically refreshed when you open the new chat modal.

Would you like to create another agent or start chatting with this one?`,
        timestamp: new Date().toISOString(),
        agentConfig: {
          path: response.path,
          created: true,
          agentName: response.path.split('/').pop()?.replace('.yaml', '') || 'unknown'
        }
      }

      setMessages(prev => [...prev, assistantResponse])
    } catch (error) {
      console.error('Failed to create agent:', error)
      
      const errorResponse: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `❌ **Sorry, I couldn't create the agent.**

There was an error processing your request. This might be due to:

- Network connectivity issues
- Server being temporarily unavailable
- Invalid agent configuration

Please try again with a more specific description of what you want your agent to do. For example:
- "Create a coding assistant that helps with Python development"
- "Make a data analysis agent that can work with CSV files"
- "Build a writing assistant for technical documentation"

The more specific you are, the better I can help you create the perfect agent!`,
        timestamp: new Date().toISOString()
      }

      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }



  return (
    <div className="flex flex-col h-full">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {message.role === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              <div className={`rounded-lg p-4 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                
                {/* Agent Creation Success Actions */}
                {message.agentConfig && message.agentConfig.created && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        {editingAgent ? 'Agent Updated Successfully!' : 'Agent Created Successfully!'}
                      </h4>
                      <div className="flex gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => navigate('/')}
                        >
                          Go to Home
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => navigate(`/?newAgent=${message.agentConfig.agentName}`)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Start Chat with Agent
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-green-700 dark:text-green-300">
                      <span className="font-medium">File Location:</span> {message.agentConfig.path}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
              <Bot className="h-4 w-4" />
            </div>
            <div className="bg-muted rounded-lg p-4 max-w-[80%]">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 animate-pulse" />
                AI is thinking...
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want your agent to do..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendMessage()
              }
            }}
            disabled={isLoading}
            className="min-h-[40px] max-h-[120px] resize-none"
            rows={1}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="mt-2 text-xs text-muted-foreground">
          Press Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  )
}
