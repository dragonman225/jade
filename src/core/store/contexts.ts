import { createContext, useContext } from 'react'
import { Settings } from '../interfaces'

export const SettingsContext = createContext<Settings | null>(null)

export function useSettings(): Settings {
  const settings = useContext(SettingsContext)
  if (!settings) {
    throw new LifecycleError('useSettings() must be called within a Provider')
  } else {
    return settings
  }
}
