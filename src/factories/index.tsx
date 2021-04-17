import * as React from 'react'
import {
  ConceptDisplayProps,
  FactoryId,
  FactoryRegistry,
  InitializedConceptData,
} from '../core/interfaces'
import { PMTextFactory } from './PMText'
import { ImageFactory } from './Image'
import { SearchToolFactory } from './SearchTool'
import { HeaderToolFactory } from './HeaderTool'

class AlexFactoryRegistry implements FactoryRegistry {
  private factories = [
    PMTextFactory,
    ImageFactory,
    SearchToolFactory,
    HeaderToolFactory,
  ]
  private default = PMTextFactory

  getDefaultContentFactory = () => this.default

  getContentFactories = () => this.factories.filter(f => !f.isTool)

  getToolFactories = () => this.factories.filter(f => f.isTool)

  getFactory = (factoryId: FactoryId) =>
    this.factories.find(f => f.id === factoryId)

  createConceptDisplay = (
    factoryId: FactoryId,
    props: ConceptDisplayProps<InitializedConceptData>
  ) => {
    const factory = this.getFactory(factoryId)

    if (!factory) {
      return (
        <span>Factory &quot;{factoryId}&quot; does not exist in registry.</span>
      )
    }

    return React.createElement(factory.component, props)
  }
}

export const factoryRegistry = new AlexFactoryRegistry()
