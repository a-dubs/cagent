import { useState, useEffect } from 'react'
import { useSettings } from './useSettings'

export function useTheme() {
  const { settings } = useSettings()
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const updateTheme = () => {
      if (settings.theme === 'system') {
        // Check system preference
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setIsDark(systemPrefersDark)
      } else {
        setIsDark(settings.theme === 'dark')
      }
    }

    // Initial theme detection
    updateTheme()

    // Listen for system theme changes if using system theme
    if (settings.theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', updateTheme)
      
      return () => {
        mediaQuery.removeEventListener('change', updateTheme)
      }
    }
  }, [settings.theme])

  return { isDark }
}
