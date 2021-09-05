import { createContext } from 'react'
import { AppState } from '../interfaces'

export const AppStateContext = createContext<AppState>(undefined)
