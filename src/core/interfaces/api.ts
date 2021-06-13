import { Action } from '../reducer'
import { Origin } from './util'
import { Concept, InitializedConceptData } from './concept'
import { DatabaseInterface, State4 } from './core'

export type FactoryId = string

export interface Factory {
  id: FactoryId
  name: string
  /** `true` to treat the products of this factory tools, otherwise content. */
  isTool?: boolean
  /** Ignore to position the products absolutely. */
  origin?: Origin
  component: React.ComponentClass<any> | React.FunctionComponent<any>
}

export interface FactoryRegistry {
  getDefaultContentFactory: () => Factory
  getContentFactories: () => Factory[]
  getToolFactories: () => Factory[]
  getFactory: (factoryId: FactoryId) => Factory | undefined
  createConceptDisplay: (
    factoryId: FactoryId,
    props: ConceptDisplayProps<InitializedConceptData>
  ) => JSX.Element
}

export interface ConceptDisplayProps<T extends InitializedConceptData> {
  readOnly: boolean
  viewMode: 'Block' | 'CardTitle' | 'NavItem'
  concept: Concept
  // messageBus: IPubSub
  state: State4
  dispatchAction: React.Dispatch<Action>
  factoryRegistry: FactoryRegistry
  database: DatabaseInterface
  onChange: (content: T) => void
  onReplace: (type: string) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
  createOverlay?(children: React.ReactNode): React.ReactPortal
}
