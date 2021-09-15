import { createContext } from 'react'

import { Actions } from './actions'
import { DatabaseInterface, FactoryRegistry } from '../interfaces'

export interface System {
  db: DatabaseInterface
  factoryRegistry: FactoryRegistry
  dispatchAction: (action: Actions) => void
  createOverlay: (children: React.ReactNode) => React.ReactPortal
  openExternal: (link: string) => void
}

export const SystemContext = createContext<System>(undefined)
