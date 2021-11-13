import { PMTextContent } from '../PMText/types'
import { getProseMirrorDoc } from '../PMText/utils'
import { schema } from '../PMText/ProseMirrorSchema/schema'
import { linkMarkName, LinkMark } from '../PMText/ProseMirrorSchema/link'
import { BlockId, ConceptId, TypedConcept } from '../../core/interfaces'
import { isInternalUrl, resolveInternalUrl } from '../../core/utils/url'

export interface Backlink {
  concept: TypedConcept<unknown>
  blockId: BlockId
}

export function isPMTextContainingLinkToConcept(
  conceptId: ConceptId,
  concept: TypedConcept<PMTextContent>
): boolean {
  const doc = getProseMirrorDoc(concept.summary.data.data, schema)
  if (!doc) return false
  let isContaining = false
  doc.descendants(node => {
    if (node.text) {
      /** Only process text nodes. */
      const linkMark = node.marks.find(
        mark => mark.type.name === linkMarkName
      ) as LinkMark
      if (!linkMark) return
      const { href } = linkMark.attrs
      if (isInternalUrl(href)) {
        const internalUrl = resolveInternalUrl(href)
        if (internalUrl.conceptId === conceptId) isContaining = true
      }
    }
  })
  return isContaining
}

export function isConceptContainingLinkToConcept(
  conceptId: ConceptId,
  concept: TypedConcept<unknown> | undefined
): boolean {
  if (!concept || !concept.summary || !concept.summary.type) return false
  switch (concept.summary.type) {
    case 'pmtext':
      return isPMTextContainingLinkToConcept(conceptId, concept)
    default:
      return false
  }
}

export function getBacklinksOf(
  conceptId: ConceptId,
  inConcepts: TypedConcept<unknown>[]
): Backlink[] {
  const conceptMap = (() => {
    const map: { [key: string]: TypedConcept<unknown> } = {}
    inConcepts.forEach(c => (map[c.id] = c))
    return map
  })()
  return inConcepts.reduce(
    (backlinks: Backlink[], inConcept: TypedConcept<unknown>) => {
      const blocksReferencingConcept = inConcept.references.filter(
        r =>
          r.to === conceptId ||
          isConceptContainingLinkToConcept(conceptId, conceptMap[r.to])
      )
      return backlinks.concat(
        blocksReferencingConcept.map(b => ({
          concept: inConcept,
          blockId: b.id,
        }))
      )
    },
    [] as Backlink[]
  )
}
