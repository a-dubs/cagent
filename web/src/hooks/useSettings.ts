import { useState } from 'react'
import { AppSettings } from '@/types'

const SETTINGS_KEY = 'cagent-settings'

const defaultSettings: AppSettings = {
  agentConfigPath: '',
  workingDirectory: '/',
  environmentVariables: {},
  theme: 'system',
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) }
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
    }
    return defaultSettings
  })

  const updateSettings = (updates: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...updates }
    setSettings(newSettings)
    
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error)
    }
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    localStorage.removeItem(SETTINGS_KEY)
  }

  return {
    settings,
    updateSettings,
    resetSettings,
  }
}