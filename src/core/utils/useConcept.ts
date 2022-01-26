import { useEffect, useState } from 'react'
import { ConceptId, TypedConcept } from '../interfaces'
import { useSystem } from '../store/systemContext'

export function useConcept(
  conceptId: ConceptId
): TypedConcept<unknown> | undefined {
  const { db } = useSystem()
  const [concept, setConcept] = useState<TypedConcept<unknown> | undefined>()

  /** Subscribe to concept change. */
  useEffect(() => {
    function updateConcept() {
      db.getConcept(conceptId)
        .then(concept => setConcept(concept))
        .catch(error => {
          throw error
        })
    }
    updateConcept()
    db.subscribeConcept(conceptId, updateConcept)
    return () => {
      db.unsubscribeConcept(conceptId, updateConcept)
    }
  }, [conceptId, db])

  return concept
}
