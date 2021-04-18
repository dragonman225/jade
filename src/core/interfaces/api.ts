import { IPubSub } from '../lib/pubsub'
import { Action } from '../reducer'
import { Origin, Vec2 } from './util'
import { InitializedConceptData, UninitializedConceptData } from './concept'
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
  content: T | UninitializedConceptData
  messageBus: IPubSub
  app: {
    state: State4
    dispatch: React.Dispatch<Action>
  }
  physicalInfo?: {
    origin: Origin
    position: Vec2
    width: number
  }
  factoryRegistry: FactoryRegistry
  database: DatabaseInterface
  onChange: (content: T) => void
  onReplace: (type: string) => void
  onInteractionStart: () => void
  onInteractionEnd: () => void
  createOverlay?(children: React.ReactNode): React.ReactPortal
}
