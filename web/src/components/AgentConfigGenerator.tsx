import { AgentConfig, Agent, Model } from '@/types'

interface AgentCreationData {
  name: string
  description: string
  instruction: string
  model: string
  provider: string
  temperature?: number
  maxTokens?: number
  toolsets: string[]
  addDate?: boolean
}

export class AgentConfigGenerator {
  static generateConfig(data: AgentCreationData): AgentConfig {
    const agentKey = data.name.toLowerCase().replace(/\s+/g, '-')
    
    const agent: Agent = {
      model: data.model,
      description: data.description,
      instruction: data.instruction,
      add_date: data.addDate ?? true
    }

    // Add toolsets if specified
    if (data.toolsets.length > 0) {
      agent.toolsets = data.toolsets.map(toolset => ({ type: toolset }))
    }

    const model: Model = {
      provider: data.provider,
      model: data.model,
      temperature: data.temperature ?? 0.7,
      max_tokens: data.maxTokens ?? 4096
    }

    return {
      version: '1.0',
      agents: {
        [agentKey]: agent
      },
      models: {
        [data.model]: model
      }
    }
  }

  static generateYAML(config: AgentConfig): string {
    const agentKey = Object.keys(config.agents)[0]
    const agent = config.agents[agentKey]
    const modelKey = Object.keys(config.models)[0]
    const model = config.models[modelKey]

    let yaml = `version: "${config.version}"\n\n`
    
    // Agents section
    yaml += `agents:\n`
    yaml += `  ${agentKey}:\n`
    yaml += `    model: ${agent.model}\n`
    yaml += `    description: "${agent.description}"\n`
    yaml += `    instruction: |\n`
    
    // Format instruction with proper indentation
    const instructionLines = agent.instruction.split('\n')
    instructionLines.forEach(line => {
      yaml += `      ${line}\n`
    })

    if (agent.toolsets && agent.toolsets.length > 0) {
      yaml += `    toolsets:\n`
      agent.toolsets.forEach(toolset => {
        yaml += `      - type: ${toolset.type}\n`
      })
    }

    if (agent.add_date) {
      yaml += `    add_date: true\n`
    }

    // Models section
    yaml += `\nmodels:\n`
    yaml += `  ${modelKey}:\n`
    yaml += `    provider: ${model.provider}\n`
    yaml += `    model: ${model.model}\n`
    
    if (model.temperature !== undefined) {
      yaml += `    temperature: ${model.temperature}\n`
    }
    
    if (model.max_tokens !== undefined) {
      yaml += `    max_tokens: ${model.max_tokens}\n`
    }

    return yaml
  }

  static validateConfig(data: AgentCreationData): string[] {
    const errors: string[] = []

    if (!data.name.trim()) {
      errors.push('Agent name is required')
    }

    if (!data.instruction.trim()) {
      errors.push('System instruction is required')
    }

    if (!data.model) {
      errors.push('Model selection is required')
    }

    if (!data.provider) {
      errors.push('Provider selection is required')
    }

    if (data.temperature !== undefined && (data.temperature < 0 || data.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2')
    }

    if (data.maxTokens !== undefined && (data.maxTokens < 1 || data.maxTokens > 32000)) {
      errors.push('Max tokens must be between 1 and 32000')
    }

    return errors
  }
}