import { useOutletContext } from 'react-router-dom'
import { Message, Session, AgentSetup } from '@/types'

export interface AppContextType {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isLoading: boolean
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
  currentSession: Session | null
  setCurrentSession: React.Dispatch<React.SetStateAction<Session | null>>
  selectedAgent: string
  setSelectedAgent: React.Dispatch<React.SetStateAction<string>>
  currentAgentSetup: AgentSetup | null
  setCurrentAgentSetup: React.Dispatch<React.SetStateAction<AgentSetup | null>>
  sessions: Session[]
  setSessions: React.Dispatch<React.SetStateAction<Session[]>>
  agentSetups: AgentSetup[]
  setAgentSetups: React.Dispatch<React.SetStateAction<AgentSetup[]>>
  sseController: React.MutableRefObject<AbortController | null>
  isInChat: boolean
  sendMessage: (content: string) => Promise<void>
  sendConfirmation: (confirmation: 'approve' | 'approve-session' | 'reject') => Promise<void>
  handleToolApproval: (toolId: string, approval: 'approve' | 'approve-session' | 'reject') => Promise<void>
  handleStartSession: () => Promise<void>
  handleAgentSetupSelect: (setup: AgentSetup) => Promise<void>
  handleSessionSelect: (sessionId: string) => Promise<void>
  handleNewChat: () => void
  handleSessionRename: (sessionId: string, newTitle: string) => Promise<void>
  handleSessionDelete: (sessionId: string) => Promise<void>
  handleSessionToggleFavorite: (sessionId: string) => void
  handleNavigate: (page: string) => void
}

export function useAppContext() {
  return useOutletContext<AppContextType>()
}