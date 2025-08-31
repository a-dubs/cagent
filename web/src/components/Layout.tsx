import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Settings, 
  MessageCircle, 
  Bot, 
  Upload, 
  Plus,
  Clock,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2
} from 'lucide-react'

import { Session, AgentSetup } from '@/types'

interface LayoutProps {
  children: React.ReactNode
  currentPage: string
  currentSessionId?: string
  sessions?: Session[]
  agentSetups?: AgentSetup[]
  onNavigate: (page: string) => void
  onSessionSelect?: (sessionId: string) => void
  onNewChat?: () => void
  onSessionRename?: (sessionId: string, newTitle: string) => void
  onSessionDelete?: (sessionId: string) => void
  onSessionToggleFavorite?: (sessionId: string) => void
  showNewChatButton?: boolean
}

export function Layout({ 
  children, 
  currentPage, 
  currentSessionId,
  sessions = [],
  agentSetups = [],
  onNavigate, 
  onSessionSelect,
  onNewChat,
  onSessionRename,
  onSessionDelete,
  onSessionToggleFavorite,
  showNewChatButton = false 
}: LayoutProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [sidebarWidth, setSidebarWidth] = useState(280) // Default width
  const [isResizing, setIsResizing] = useState(false)
  const navItems = [
    { id: 'home', label: 'Home', icon: MessageCircle },
    { id: 'setups', label: 'Agents', icon: Bot },
    { id: 'agent-creator', label: 'Create Agent', icon: Plus },
    { id: 'environments', label: 'Environments', icon: Settings },
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

  const getAgentSetupName = (agentFilename: string) => {
    if (!agentFilename) return 'Unknown Agent'
    
    // Try to find a matching agent setup by config path
    const matchingSetup = agentSetups.find(setup => 
      setup.agent_config_path === agentFilename || 
      setup.agent_config_path.endsWith(`/${agentFilename}`) ||
      setup.agent_config_path.endsWith(`/${agentFilename}.yaml`) ||
      setup.agent_config_path.endsWith(`/${agentFilename}.yml`)
    )
    
    if (matchingSetup) {
      return matchingSetup.name
    }
    
    // Fallback: format the filename nicely
    const name = agentFilename.replace(/\.ya?ml$/i, '').replace(/[_-]/g, ' ')
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  const handleRenameStart = (session: Session) => {
    setEditingSessionId(session.id)
    setEditingTitle(session.title)
  }

  const handleRenameConfirm = () => {
    if (editingSessionId && editingTitle.trim() && onSessionRename) {
      onSessionRename(editingSessionId, editingTitle.trim())
    }
    setEditingSessionId(null)
    setEditingTitle('')
  }

  const handleRenameCancel = () => {
    setEditingSessionId(null)
    setEditingTitle('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameConfirm()
    } else if (e.key === 'Escape') {
      handleRenameCancel()
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    const newWidth = Math.max(200, Math.min(500, e.clientX))
    setSidebarWidth(newWidth)
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing])

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
        <div 
          className="border-r bg-muted/10 flex flex-col relative"
          style={{ width: sidebarWidth }}
        >
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
                  // Keep sessions that have messages OR were created recently (within last hour)
                  if (session.num_messages > 0) return true;
                  
                  // Also show recent sessions even if they have no messages yet
                  if (session.created_at) {
                    const sessionDate = new Date(session.created_at);
                    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                    return sessionDate > oneHourAgo;
                  }
                  
                  return false;
                });
                
                return activeSessions.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No chat sessions yet
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`group relative flex items-center rounded-md hover:bg-muted/50 ${
                          currentSessionId === session.id ? 'bg-secondary' : ''
                        }`}
                      >
                        {editingSessionId === session.id ? (
                          <div className="flex-1 p-2">
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onBlur={handleRenameConfirm}
                              className="h-auto p-1 text-sm"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <>
                            {/* Chat content - takes available space but leaves room for dropdown */}
                            <Button
                              variant="ghost"
                              className="flex-1 justify-start h-auto p-2 text-left hover:bg-transparent min-w-0"
                              onClick={() => onSessionSelect?.(session.id)}
                              style={{ marginRight: '32px' }} // Reserve space for dropdown
                            >
                              <div className="flex items-center gap-2 min-w-0 w-full">
                                {session.isFavorite && (
                                  <Star className="h-3 w-3 text-yellow-500 fill-current flex-shrink-0" />
                                )}
                                <div className="flex flex-col items-start gap-1 min-w-0 flex-1">
                                  <div className="text-sm font-medium truncate w-full">
                                    {session.title || 'Untitled Chat'}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatTimeAgo(session.created_at)}
                                  </div>
                                  <div className="text-xs text-muted-foreground/70 truncate w-full">
                                    {getAgentSetupName(session.most_recent_agent_filename)}
                                  </div>
                                </div>
                              </div>
                            </Button>
                            
                            {/* Dropdown menu - absolutely positioned on the right */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => handleRenameStart(session)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onSessionToggleFavorite?.(session.id)}
                                >
                                  <Star className={`h-4 w-4 mr-2 ${session.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                                  {session.isFavorite ? 'Unfavorite' : 'Favorite'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => onSessionDelete?.(session.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>
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
          
          {/* Resize Handle */}
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-border transition-colors"
            onMouseDown={handleMouseDown}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {children}
        </div>
      </div>
    </div>
  )
}
