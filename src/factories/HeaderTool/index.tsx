import * as React from 'react'
import { useContext, useState, useCallback } from 'react'
import { classes } from 'typestyle'

import { styles } from './index.styles'
import { AppStateContext } from '../../core/store/appStateContext'
import { Add } from '../../core/components/Icons/Add'
import { ArrowBack } from '../../core/components/Icons/ArrowBack'
import { ArrowForward } from '../../core/components/Icons/ArrowForward'
import { ExpandDown } from '../../core/components/Icons/ExpandDown'
import { ExpandUp } from '../../core/components/Icons/ExpandUp'
import { Home } from '../../core/components/Icons/Home'
import { Action } from '../../core/store/actions'
import { ConceptDisplayProps, Factory } from '../../core/interfaces'
import { createConcept } from '../../core/utils/concept'

type Props = ConceptDisplayProps<undefined>

const HeaderTool: React.FunctionComponent<Props> = props => {
  const {
    viewMode,
    blockId,
    database,
    dispatchAction,
    onInteractionStart,
    onInteractionEnd,
  } = props
  const state = useContext(AppStateContext)

  const [titleCollapsed, setTitleCollapsed] = useState(true)
  const toggleTitleCollapsed = useCallback(() => setTitleCollapsed(c => !c), [])
  const createCanvas = useCallback(() => {
    const canvas = createConcept('pmtext')
    database.createConcept(canvas)
    dispatchAction({
      type: Action.BlockOpenAsCanvas,
      data: {
        id: canvas.id,
      },
    })
  }, [database, dispatchAction])
  const navigateBack = useCallback(() => {
    setTitleCollapsed(true)
    dispatchAction({
      type: Action.NavigateBack,
    })
  }, [dispatchAction])
  const navigateForward = useCallback(() => {
    return
  }, [])

  if (viewMode !== 'Block') {
    return <div className={styles.HeaderToolNav}>🔧 Header Tool</div>
  }

  return (
    <div
      className={classes(
        styles.HeaderToolBlock,
        !titleCollapsed && styles.HeaderToolBlockNotCollapsed
      )}>
      <button className={styles.Button} onClick={navigateBack}>
        <ArrowBack />
      </button>
      <button className={styles.Button} onClick={navigateForward}>
        <ArrowForward />
      </button>
      <button
        className={styles.Button}
        onClick={() => {
          setTitleCollapsed(true)
          dispatchAction({
            type: Action.BlockOpenAsCanvas,
            data: { id: state.settings.homeConceptId },
          })
        }}>
        <Home />
      </button>
      <div
        className={classes(
          styles.TitleContainer,
          !titleCollapsed && styles.TitleContainerNotCollapsed
        )}>
        {(function () {
          const contentProps: ConceptDisplayProps<unknown> & {
            key: string
          } = {
            viewMode: 'CardTitle',
            readOnly: false,
            dispatchAction,
            factoryRegistry: props.factoryRegistry,
            database: props.database,
            concept: state.viewingConcept,
            blockId,
            onChange: data =>
              dispatchAction({
                type: Action.ConceptWriteData,
                data: {
                  id: state.viewingConcept.id,
                  type: state.viewingConcept.summary.type,
                  content: data,
                },
              }),
            onReplace: typeId =>
              dispatchAction({
                type: Action.ConceptWriteData,
                data: {
                  id: state.viewingConcept.id,
                  type: typeId,
                  content: { initialized: false },
                },
              }),
            onInteractionStart,
            onInteractionEnd,
            key: 'CardTitle-' + state.viewingConcept.id,
          }

          return props.factoryRegistry.createConceptDisplay(
            state.viewingConcept.summary.type,
            contentProps
          )
        })()}
      </div>
      <button className={styles.Button} onClick={toggleTitleCollapsed}>
        {titleCollapsed ? <ExpandDown /> : <ExpandUp />}
      </button>
      <button className={styles.Button} onClick={createCanvas}>
        <Add />
      </button>
    </div>
  )
}

export const HeaderToolFactory: Factory = {
  id: 'headertool',
  name: 'Header Tool',
  isTool: true,
  component: HeaderTool,
}
