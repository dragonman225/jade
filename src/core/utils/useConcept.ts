import { useEffect, useRef, useState } from 'react'
import { ConceptId, TypedConcept } from '../interfaces'
import { useSystem } from '../store/systemContext'

export function useConcept(
  conceptId: ConceptId
): TypedConcept<unknown> | undefined {
  const { db } = useSystem()
  const [concept, setConcept] = useState<TypedConcept<unknown> | undefined>()

  /** Subscribe to concept change. */
  useEffect(() => {
    function updateConcept(concept: TypedConcept<unknown> | undefined) {
      setConcept(concept)
    }
    db.getConcept(conceptId)
      .then(concept => setConcept(concept))
      .catch(error => {
        throw error
      })
    db.subscribeConcept(conceptId, updateConcept)
    return () => {
      db.unsubscribeConcept(conceptId, updateConcept)
    }
  }, [conceptId, db])

  return concept
}

/** Prefer this as it set state in batch. */
export function useConceptMap(
  conceptIds: ConceptId[]
): Record<ConceptId, TypedConcept<unknown> | undefined> {
  const { db } = useSystem()
  const [conceptMap, setConceptMap] = useState<
    Record<ConceptId, TypedConcept<unknown> | undefined>
  >({})
  const rConceptMap = useRef<
    Record<ConceptId, TypedConcept<unknown> | undefined>
  >({})

  useEffect(() => {
    rConceptMap.current = conceptMap
  }, [conceptMap])

  /** Subscribe to concept change. */
  useEffect(() => {
    const loadingConcepts: Promise<TypedConcept<unknown> | undefined>[] = []
    const loadingConceptIds: ConceptId[] = []
    for (let i = 0; i < conceptIds.length; i++) {
      const conceptId = conceptIds[i]
      const concept = rConceptMap.current[conceptId]
      if (!concept) {
        loadingConcepts.push(db.getConcept(conceptId))
        loadingConceptIds.push(conceptId)
      }
    }

    Promise.all(loadingConcepts)
      .then(loadedConcepts => {
        if (loadedConcepts.length === 0) return
        const loadedConceptMap: Record<
          ConceptId,
          TypedConcept<unknown> | undefined
        > = {}
        for (let i = 0; i < loadedConcepts.length; i++) {
          const conceptId = loadingConceptIds[i]
          const concept = loadedConcepts[i]
          loadedConceptMap[conceptId] = concept
        }
        setConceptMap(conceptMap => ({ ...conceptMap, ...loadedConceptMap }))
      })
      .catch(error => console.error(error))

    function updateConcept(updatedConcept: TypedConcept<unknown> | undefined) {
      if (!updatedConcept) return
      setConceptMap(conceptMap => ({
        ...conceptMap,
        [updatedConcept.id]: updatedConcept,
      }))
    }

    for (let i = 0; i < conceptIds.length; i++) {
      db.subscribeConcept(conceptIds[i], updateConcept)
    }

    return () => {
      for (let i = 0; i < conceptIds.length; i++) {
        db.unsubscribeConcept(conceptIds[i], updateConcept)
      }
    }
  }, [conceptIds, db])

  return conceptMap
}
