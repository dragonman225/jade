import * as React from 'react'
import { stylesheet } from 'typestyle'

import { factoryRegistry } from './'
import { ConceptDisplayProps } from '../core/interfaces'

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
  'viewMode' | 'concept' | 'database' | 'dispatchAction' | 'blockId'
>
export function ConceptPreview({
  viewMode,
  concept,
  database,
  dispatchAction,
  blockId,
}: Props): JSX.Element {
  return (
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
  )
}
