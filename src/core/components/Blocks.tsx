import * as React from 'react'
import { useContext, useEffect } from 'react'

import { SystemContext } from '../store/systemContext'
import { BlockDriver } from './BlockDriver'
import { ViewObject } from './ViewObject'
import { BlockInstance } from '../interfaces'

interface Props {
  blocks: BlockInstance[]
  onRender?: () => void
}

export function Blocks({ blocks, onRender }: Props): JSX.Element {
  const { db, factoryRegistry, dispatchAction, createOverlay } = useContext(
    SystemContext
  )

  useEffect(() => {
    onRender && onRender()
  }, [onRender])

  return (
    <>
      {blocks.map(b => (
        <ViewObject
          key={`vo-b-${b.id}`}
          posType={b.posType}
          pos={b.pos}
          size={b.size}>
          <BlockDriver
            block={b}
            db={db}
            factoryRegistry={factoryRegistry}
            dispatchAction={dispatchAction}
            createOverlay={createOverlay}
          />
        </ViewObject>
      ))}
    </>
  )
}
