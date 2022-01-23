import { createContext, useContext } from 'react'
import { AppState } from '../interfaces'

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState(): AppState {
  const appState = useContext(AppStateContext)
  if (!appState) {
    throw new LifecycleError('useAppState() must be called within a Provider')
  } else {
    return appState
  }
}
