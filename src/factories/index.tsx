import * as React from 'react'

import {
  ConceptDisplayProps,
  FactoryId,
  FactoryRegistry,
  TypedConcept,
} from '../core/interfaces'
import { ErrorBoundary } from '../core/components/ErrorBoundary'
import { PMTextFactory } from './PMText'
import { SlateTextFactory } from './SlateText'
import { ImageFactory } from './Image'
import { EmbedFactory } from './Embed'
import { StatusFactory } from './Status'
import { SearchToolFactory } from './SearchTool'
import { HeaderToolFactory } from './HeaderTool'
import { RecentToolFactory } from './RecentTool'
import { InsightToolFactory } from './InsightTool'

class AlexFactoryRegistry implements FactoryRegistry {
  private factories = [
    PMTextFactory,
    SlateTextFactory,
    ImageFactory,
    EmbedFactory,
    StatusFactory,
    SearchToolFactory,
    HeaderToolFactory,
    RecentToolFactory,
    InsightToolFactory,
  ]
  private default = PMTextFactory

  getDefaultContentFactory = () => this.default

  getContentFactories = () => this.factories.filter(f => !f.isTool)

  getToolFactories = () => this.factories.filter(f => f.isTool)

  getFactory = (factoryId: FactoryId) =>
    this.factories.find(f => f.id === factoryId)

  getConceptString = (concept: TypedConcept<unknown>) => {
    const type = concept.summary.type
    const factory = this.getFactory(type)
    return factory && factory.toText ? factory.toText(concept) : ''
  }

  createConceptDisplay = (
    factoryId: FactoryId,
    props: ConceptDisplayProps<unknown>
  ) => {
    const factory = this.getFactory(factoryId)

    if (!factory) {
      return (
        <span>Factory &quot;{factoryId}&quot; does not exist in registry.</span>
      )
    }

    return (
      <ErrorBoundary>
        {React.createElement(factory.component, props)}
      </ErrorBoundary>
    )
  }
}

export const factoryRegistry = new AlexFactoryRegistry()
