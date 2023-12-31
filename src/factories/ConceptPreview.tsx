import * as React from 'react'
import { stylesheet } from 'typestyle'

import { factoryRegistry } from './'
import { ConceptLoader } from '../core/components/ConceptLoader'
import { ConceptDisplayProps, ConceptId } from '../core/interfaces'
import { useConcept } from '../core/utils/useConcept'

function noop() {
  return
}

const styles = stylesheet({
  conceptPreview: {
    maxHeight: 'inherit',
    pointerEvents: 'none',
  },
})

type Props = Pick<
  ConceptDisplayProps<unknown>,
  'viewMode' | 'database' | 'dispatchAction' | 'blockId'
> & {
  conceptId: ConceptId
}

export function ConceptPreview({
  viewMode,
  conceptId,
  database,
  dispatchAction,
  blockId,
}: Props): JSX.Element {
  const concept = useConcept(conceptId)

  return concept ? (
    <div className={styles.conceptPreview}>
      {factoryRegistry.createConceptDisplay(concept.summary.type, {
        viewMode,
        blockId,
        readOnly: true,
        concept,
        dispatchAction,
        factoryRegistry,
        database,
        onChange: noop,
        onReplace: noop,
        onInteractionStart: noop,
        onInteractionEnd: noop,
      })}
    </div>
  ) : (
    <ConceptLoader />
  )
}
