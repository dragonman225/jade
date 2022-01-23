import { createContext, useContext } from 'react'

import { Actions } from './actions'
import { DatabaseInterface, FactoryRegistry } from '../interfaces'

export interface System {
  db: DatabaseInterface
  factoryRegistry: FactoryRegistry
  dispatchAction: (action: Actions) => void
  createOverlay: (children: React.ReactNode) => React.ReactPortal | null
  openExternal: (link: string) => void
}

export const SystemContext = createContext<System | null>(null)

export function useSystem(): System {
  const system = useContext(SystemContext)
  if (!system) {
    throw new LifecycleError('useSystem() must be called within a Provider')
  } else {
    return system
  }
}
