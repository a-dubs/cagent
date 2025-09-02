import { AgentCreationAssistant } from '@/components/AgentCreationAssistant'

interface AgentAssistantProps {
  editingAgent?: {
    name: string
    path: string
    description?: string
  }
}

export function AgentAssistant({ editingAgent }: AgentAssistantProps) {
  return <AgentCreationAssistant editingAgent={editingAgent} />
}