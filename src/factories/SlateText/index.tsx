import * as React from 'react'
import { useState, useCallback } from 'react'
import * as Slate from 'slate'

import { SlateTextEditor } from './SlateTextEditor'
import { styles } from './index.styles'
import {
  ConceptDisplayProps,
  Factory,
  TypedConcept,
} from '../../core/interfaces'

/**
 * Slate CJK bugs
 * https://github.com/ianstormtaylor/slate/issues/3882
 * https://github.com/ianstormtaylor/slate/issues/3607
 * https://github.com/ianstormtaylor/slate/issues/3292
 */

interface TextContent {
  initialized?: boolean
  data: TypedElement[]
}

interface TypedElement extends Slate.Element {
  type: string
}

interface State {
  slateData: TypedElement[]
  isNewText: boolean
}

function getSlateData(data: TextContent): TypedElement[] {
  if (data.initialized) return data.data
  else return [{ type: 'paragraph', children: [{ text: '' }] }]
}

export function SlateText(
  props: ConceptDisplayProps<TextContent>
): JSX.Element {
  const {
    readOnly,
    viewMode,
    concept,
    onChange,
    onInteractionStart,
    onInteractionEnd,
  } = props

  const [state, setState] = useState<State>({
    slateData: getSlateData(concept.summary.data),
    isNewText: !concept.summary.data.initialized,
  })

  const handleChange = useCallback(
    (slateData: TypedElement[]): void => {
      setState({ slateData, isNewText: false })
      onChange({ initialized: true, data: slateData })
    },
    [onChange]
  )

  const slateTextEditor = (
    <SlateTextEditor
      readOnly={readOnly}
      // Cannot type Japanese in programmatically focused editor when the text block is newly created.
      forceFocus={state.isNewText}
      content={state.slateData}
      onChange={handleChange}
      onFocus={onInteractionStart}
      onBlur={onInteractionEnd}
    />
  )

  switch (viewMode) {
    case 'NavItem':
      return <div className={styles.NavItem}>{slateTextEditor}</div>
    case 'Block':
      return <div className={styles.Block}>{slateTextEditor}</div>
    case 'CardTitle':
      return <div className={styles.CardTitle}>{slateTextEditor}</div>
    default:
      return (
        <span>
          Unknown <code>viewMode</code>: {viewMode}
        </span>
      )
  }
}

export const SlateTextFactory: Factory = {
  id: 'text',
  name: 'SlateText',
  component: SlateText,
  toText: (concept: TypedConcept<TextContent>) => {
    return 'slatetext ' + JSON.stringify(concept.summary.data)
  },
}
