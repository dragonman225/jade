import { Actions } from '../store/actions'
import { TypedConcept } from './concept'
import { DatabaseInterface, AppState } from './core'
import { Origin } from './util'

export type FactoryId = string

export interface Factory {
  id: FactoryId
  name: string
  /** `true` to treat the products of this factory tools, otherwise content. */
  isTool?: boolean
  /** Ignore to position the products absolutely. */
  origin?: Origin
  component:
    | React.ComponentClass<ConceptDisplayProps<unknown>>
    | React.FunctionComponent<ConceptDisplayProps<unknown>>
}

export interface FactoryRegistry {
  getDefaultContentFactory: () => Factory
  getContentFactories: () => Factory[]
  getToolFactories: () => Factory[]
  getFactory: (factoryId: FactoryId) => Factory | undefined
  createConceptDisplay: (
    factoryId: FactoryId,
    props: ConceptDisplayProps<unknown>
  ) => JSX.Element
}

export interface ConceptDisplayProps<T> {
  readOnly: boolean
  viewMode: 'Block' | 'CardTitle' | 'NavItem'
  concept: TypedConcept<T>
  dispatchAction: (action: Actions) => void
  factoryRegistry: FactoryRegistry
  database: DatabaseInterface
  onChange: (content: T) => void
  onReplace: (type: string) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
  createOverlay?(children: React.ReactNode): React.ReactPortal
}
