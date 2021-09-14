import { TypedConcept } from '../interfaces'

export function getUrlForConcept(concept: TypedConcept<unknown>): string {
  return `jade://v1/concept/${concept.id}`
}

export function getConceptIdFromUrl(url: string): string {
  const splits = url.split('/')
  const last = splits.pop()
  return last ? last : splits.pop()
}

export function isInternalUrl(url: string): boolean {
  return url.startsWith('jade://')
}
