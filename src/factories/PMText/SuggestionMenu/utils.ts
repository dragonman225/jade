import {
  Concept,
  FactoryRegistry,
  TypedConcept,
} from '../../../core/interfaces'
import { Option } from './useSuggestionMenu'

export function pmtextOnly(c: TypedConcept<unknown>): boolean {
  return c.summary.type === 'pmtext'
}

export function includeKeyword(
  keyword: string,
  factoryRegistry: FactoryRegistry
) {
  return (c: TypedConcept<unknown>): boolean =>
    factoryRegistry
      .getConceptString(c)
      .toLocaleLowerCase()
      .includes(keyword.toLocaleLowerCase())
}

export function mapConceptToOption(factoryRegistry: FactoryRegistry) {
  return (c: TypedConcept<unknown>): Option => ({
    id: c.id,
    title: factoryRegistry.getConceptString(c),
  })
}

export function lastEditedTimeDescendingAndCanvasFirst(
  ca: TypedConcept<unknown>,
  cb: TypedConcept<unknown>
): number {
  if (Concept.isHighOrder(ca) === Concept.isHighOrder(cb))
    return cb.lastEditedTime - ca.lastEditedTime
  else if (Concept.isHighOrder(ca)) return -1
  else return 1
}
