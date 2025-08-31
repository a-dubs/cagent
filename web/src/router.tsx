import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/components/AppLayout'
import { HomePage } from '@/components/pages/HomePage'
import { AgentSetupsPage } from '@/components/pages/AgentSetupsPage'
import { EnvironmentSetupsPage } from '@/components/pages/EnvironmentSetupsPage'
import { ConfigManagerPage } from '@/components/pages/ConfigManagerPage'
import { ChatPage } from '@/components/pages/ChatPage'
import { AgentCreatorPage } from '@/components/pages/AgentCreatorPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'agents',
        element: <AgentSetupsPage />
      },
      {
        path: 'agents/create',
        element: <AgentCreatorPage />
      },
      {
        path: 'environments',
        element: <EnvironmentSetupsPage />
      },
      {
        path: 'configs',
        element: <ConfigManagerPage />
      },
      {
        path: 'chat/:sessionId',
        element: <ChatPage />
      },
      {
        path: 'chat',
        element: <Navigate to="/" replace />
      }
    ]
  }
])