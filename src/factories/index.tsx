import * as React from 'react'
import {
  ContentProps,
  Factory,
  FactoryId,
  FactoryRegistry,
  InitializedConceptData,
} from '../core/interfaces'
import { PMTextFactory } from './PMText'
import { ImageFactory } from './Image'
import { SearchToolFactory } from './SearchTool'

class AlexFactoryRegistry implements FactoryRegistry {
  private factories = [PMTextFactory, ImageFactory, SearchToolFactory]
  private default = PMTextFactory

  getDefault = (): Factory => this.default

  getList = (): Factory[] => this.factories

  get = (factoryId: FactoryId): Factory | undefined =>
    this.factories.find(f => f.id === factoryId)

  produceConcept = (
    factoryId: FactoryId,
    props: ContentProps<InitializedConceptData>
  ): JSX.Element => {
    const factory = this.get(factoryId)

    if (!factory) {
      return (
        <span>Factory &quot;{factoryId}&quot; does not exist in registry.</span>
      )
    }

    return React.createElement(factory.component, props)
  }
}

export const factoryRegistry = new AlexFactoryRegistry()
