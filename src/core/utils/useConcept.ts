import { useEffect, useState } from 'react'
import { ConceptId, TypedConcept } from '../interfaces'
import { useSystem } from '../store/systemContext'

export function useConcept(
  conceptId: ConceptId
): TypedConcept<unknown> | undefined {
  const { db } = useSystem()
  const [concept, setConcept] = useState<TypedConcept<unknown> | undefined>(
    () => db.getConcept(conceptId)
  )

  /** Subscribe to concept change. */
  useEffect(() => {
    function handleUpdate() {
      setConcept(db.getConcept(conceptId))
    }
    db.subscribeConcept(conceptId, handleUpdate)
    return () => {
      db.unsubscribeConcept(conceptId, handleUpdate)
    }
  }, [conceptId, db])

  return concept
}
