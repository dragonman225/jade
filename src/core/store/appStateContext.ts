import { createContext, useContext } from 'react'
import { AppState } from '../interfaces'

export const AppStateContext = createContext<Omit<AppState, 'settings'> | null>(
  null
)

export function useAppState(): Omit<AppState, 'settings'> {
  const appState = useContext(AppStateContext)
  if (!appState) {
    throw new LifecycleError('useAppState() must be called within a Provider')
  } else {
    return appState
  }
}
