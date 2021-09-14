import { BlockId } from './block'
import { TypedConcept } from './concept'
import { DatabaseInterface } from './core'
import { Origin } from './util'
import { Actions } from '../store/actions'

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
  toText?: (concept: TypedConcept<unknown>) => string
}

export interface FactoryRegistry {
  getDefaultContentFactory: () => Factory
  getContentFactories: () => Factory[]
  getToolFactories: () => Factory[]
  getFactory: (factoryId: FactoryId) => Factory | undefined
  getConceptString: (concept: TypedConcept<unknown>) => string
  createConceptDisplay: (
    factoryId: FactoryId,
    props: ConceptDisplayProps<unknown>
  ) => JSX.Element
}

export interface ConceptDisplayProps<T> {
  readOnly: boolean
  viewMode: 'Block' | 'CardTitle' | 'NavItem'
  concept: TypedConcept<T>
  blockId: BlockId
  dispatchAction: (action: Actions) => void
  factoryRegistry: FactoryRegistry
  database: DatabaseInterface
  onChange: (content: T) => void
  onReplace: (type: string) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
  createOverlay?: (children: React.ReactNode) => React.ReactPortal
}
