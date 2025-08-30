import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send, User, Sparkles, CheckCircle, Copy } from 'lucide-react'
import { useAppContext } from '@/hooks/useAppContext'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  agentConfig?: any
}

export function AgentCreationAssistant() {
  const navigate = useNavigate()
  const { setAgentSetups } = useAppContext()
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I'm your AI assistant for creating custom agents. I can help you design the perfect agent for your needs.

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

    // Simulate AI response with agent configuration generation
    setTimeout(() => {
      const assistantResponse = generateAIResponse(userMessage.content, messages)
      setMessages(prev => [...prev, assistantResponse])
      setIsLoading(false)
    }, 1500)
  }

  const generateAIResponse = (userInput: string, _chatHistory: ChatMessage[]): ChatMessage => {
    const lowerInput = userInput.toLowerCase()
    
    // Analyze user input and generate appropriate response
    if (lowerInput.includes('code') || lowerInput.includes('programming') || lowerInput.includes('development')) {
      const config = {
        name: 'Custom Code Assistant',
        description: 'AI-powered coding assistant tailored to your needs',
        instruction: `You are an expert software developer and coding assistant. Help users with:
- Writing clean, efficient code
- Debugging and troubleshooting
- Code reviews and best practices
- Architecture decisions
- Testing strategies

Always provide clear explanations and consider edge cases.`,
        model: 'gpt-4',
        provider: 'openai',
        toolsets: ['shell', 'file'],
        workingDirectory: '/workspace',
        environmentVariables: { 'NODE_ENV': 'development' }
      }

      return {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `Based on your request for coding assistance, I've designed a specialized code assistant agent for you.

**Agent Overview:**
- **Name:** ${config.name}
- **Purpose:** Help with programming tasks, debugging, and development workflows
- **Model:** ${config.model} (${config.provider})

**Capabilities:**
- File system access for reading/writing code
- Shell command execution for testing and building
- Code analysis and debugging
- Best practices guidance

**Working Environment:**
- Directory: ${config.workingDirectory}
- Environment: Development mode enabled

This agent will be perfect for software development tasks. Would you like me to create this agent for you, or would you like to modify anything?`,
        timestamp: new Date().toISOString(),
        agentConfig: config
      }
    }

    if (lowerInput.includes('data') || lowerInput.includes('analysis') || lowerInput.includes('analytics')) {
      const config = {
        name: 'Data Analysis Expert',
        description: 'Specialized data analyst and visualization expert',
        instruction: `You are a skilled data analyst and statistician. Help users with:
- Data cleaning and preprocessing
- Statistical analysis and hypothesis testing
- Creating visualizations and insights
- Pattern recognition and trend analysis
- Business intelligence and reporting

Always explain your methodology and provide actionable insights.`,
        model: 'claude-3-sonnet',
        provider: 'anthropic',
        toolsets: ['file', 'database'],
        workingDirectory: '/data',
        environmentVariables: { 'PYTHONPATH': '/data/scripts', 'R_LIBS': '/data/r-packages' }
      }

      return {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `Perfect! I've designed a data analysis specialist for you.

**Agent Overview:**
- **Name:** ${config.name}
- **Purpose:** Advanced data analysis, statistics, and visualization
- **Model:** ${config.model} (${config.provider})

**Capabilities:**
- File access for data processing
- Database connectivity for data queries
- Statistical analysis and modeling
- Visualization and reporting

**Working Environment:**
- Directory: ${config.workingDirectory}
- Python and R environment configured

This agent excels at turning raw data into actionable insights. Ready to create it?`,
        timestamp: new Date().toISOString(),
        agentConfig: config
      }
    }

    // Default helpful response
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: `I'd be happy to help you create an agent! To design the best agent for your needs, could you tell me more about:

1. **What specific tasks** should your agent handle?
2. **What tools or systems** does it need to interact with?
3. **What's your preferred AI model** (GPT-4, Claude, etc.)?
4. **Any special requirements** like working directories or environment variables?

The more details you provide, the better I can tailor the agent configuration for you.`,
      timestamp: new Date().toISOString()
    }
  }

  const handleCreateAgent = async (config: any) => {
    try {
      const agentSetup = {
        name: config.name,
        description: config.description,
        agent_config_path: `${config.name.toLowerCase().replace(/\s+/g, '-')}.yaml`,
        working_directory: config.workingDirectory,
        environment_variables: config.environmentVariables,
        id: Date.now()
      }

      setAgentSetups(prev => [...prev, agentSetup])
      navigate('/agents')
    } catch (error) {
      console.error('Failed to create agent:', error)
    }
  }

  const handleCopyConfig = (config: any) => {
    const yamlConfig = generateYAMLConfig(config)
    navigator.clipboard.writeText(yamlConfig)
  }

  const generateYAMLConfig = (config: any): string => {
    return `version: "1.0"

agents:
  ${config.name.toLowerCase().replace(/\s+/g, '-')}:
    model: ${config.model}
    description: "${config.description}"
    instruction: |
      ${config.instruction.split('\n').map((line: string) => `      ${line}`).join('\n')}
    toolsets:
${config.toolsets.map((toolset: string) => `      - type: ${toolset}`).join('\n')}

models:
  ${config.model}:
    provider: ${config.provider}
    model: ${config.model}
    temperature: 0.7
    max_tokens: 4096`
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
                
                {/* Agent Configuration Preview */}
                {message.agentConfig && (
                  <div className="mt-4 p-4 bg-background rounded border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-foreground">Generated Agent Configuration</h4>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCopyConfig(message.agentConfig)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy YAML
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleCreateAgent(message.agentConfig)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Create Agent
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-foreground">
                      <div>
                        <span className="font-medium">Model:</span> {message.agentConfig.model}
                      </div>
                      <div>
                        <span className="font-medium">Provider:</span> {message.agentConfig.provider}
                      </div>
                      <div>
                        <span className="font-medium">Working Dir:</span> {message.agentConfig.workingDirectory}
                      </div>
                      <div>
                        <span className="font-medium">Toolsets:</span> {message.agentConfig.toolsets.join(', ')}
                      </div>
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
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want your agent to do..."
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
          />
          <Button 
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
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