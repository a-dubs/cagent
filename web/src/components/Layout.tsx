import React from 'react'
import { Button } from '@/components/ui/button'
import { 
  Settings, 
  MessageCircle, 
  Bot, 
  Upload, 
  Plus,
  Clock
} from 'lucide-react'

import { Session } from '@/types'

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  currentSessionId?: string
  sessions?: Session[]
  onNavigate: (page: string) => void
  onSessionSelect?: (sessionId: string) => void
  onNewChat?: () => void
  showNewChatButton?: boolean
}

export function Layout({ 
  children, 
  currentPage, 
  currentSessionId,
  sessions = [],
  onNavigate, 
  onSessionSelect,
  onNewChat,
  showNewChatButton = false 
}: LayoutProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: MessageCircle },
    { id: 'setups', label: 'Agent Setups', icon: Bot },
    { id: 'configs', label: 'Config Manager', icon: Upload },
  ]

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Unknown'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    
    return date.toLocaleDateString()
  }

  const formatAgentName = (agentFilename: string) => {
    if (!agentFilename) return 'Unknown Agent'
    // Remove .yaml extension and capitalize
    const name = agentFilename.replace(/\.yaml?$/i, '')
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Top Navigation Bar */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h1 className="text-lg font-semibold">cagent</h1>
          </div>
          
          <div className="flex-1" />
          
          <div className="flex items-center gap-2">
            {showNewChatButton && onNewChat && (
              <Button 
                onClick={onNewChat}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
            )}
            
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r bg-muted/10 flex flex-col">
          {/* Navigation Section */}
          <div className="p-4 border-b">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Button
                    key={item.id}
                    variant={currentPage === item.id ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => onNavigate(item.id)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                )
              })}
              
              {/* New Chat Button in Sidebar */}
              {onNewChat && (
                <Button
                  variant="outline"
                  className="w-full justify-start border-dashed"
                  onClick={onNewChat}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              )}
            </div>
          </div>
          
          {/* Sessions Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Recent Chats</span>
              </div>
              
              {(() => {
                const activeSessions = sessions.filter((session) => {
                  // Filter out sessions that are likely empty
                  // Keep sessions that have messages
                  return session.num_messages > 0;
                });
                
                return activeSessions.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No chat sessions yet
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activeSessions.map((session) => (
                    <Button
                      key={session.id}
                      variant={currentSessionId === session.id ? "secondary" : "ghost"}
                      className="w-full justify-start h-auto p-2 text-left"
                      onClick={() => onSessionSelect?.(session.id)}
                    >
                      <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
                        <div className="text-sm font-medium truncate w-full">
                          {session.title || 'Untitled Chat'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(session.created_at)}
                        </div>
                        <div className="text-xs text-muted-foreground/70">
                          {formatAgentName(session.most_recent_agent_filename)}
                        </div>
                      </div>
                    </Button>
                                      ))}
                  </div>
                );
              })()}
            </div>
          </div>
          
          {/* Sidebar Footer */}
          <div className="p-4 border-t">
            <div className="text-xs text-muted-foreground">
              Version 1.0.0
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
