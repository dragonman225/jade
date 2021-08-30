import * as React from 'react'
import { useContext } from 'react'
import { stylesheet } from 'typestyle'

import { AppStateContext } from '../../core/store/appStateContext'
import { Home } from '../../core/components/Icons/Home'
import { Action } from '../../core/store/actions'
import { ConceptDisplayProps, Factory } from '../../core/interfaces'

type Props = ConceptDisplayProps<undefined>

const styles = stylesheet({
  HeaderTool: {
    width: '100%',
    display: 'flex',
    flexWrap: 'nowrap',
    padding: '0px 20px',
  },
  HomeBtnContainer: {
    flex: '0 0 50px',
    height: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  HomeBtn: {
    width: 30,
    height: 30,
    fill: '#000',
    transition: 'transform 0.2s ease-in-out',
    border: 'none',
    background: 'unset',
    $nest: {
      '&:hover': {
        transform: 'scale(1.2)',
      },
      '&:active': {
        transform: 'scale(0.9)',
      },
      '&:focus': {
        outline: 'none',
      },
    },
  },
  CardTitleContainer: {
    flex: '1 1 50px',
    minHeight: 50,
    maxHeight: 200,
    overflow: 'auto',
    display: 'flex',
  },
})

const HeaderTool: React.FunctionComponent<Props> = props => {
  const { viewMode, onInteractionStart, onInteractionEnd } = props
  const state = useContext(AppStateContext)

  if (viewMode !== 'Block') {
    return <span>Recent Tool</span>
  }

  return (
    <div className={styles.HeaderTool}>
      <div className={styles.HomeBtnContainer}>
        <button
          className={styles.HomeBtn}
          onClick={() =>
            props.dispatchAction({
              type: Action.BlockOpenAsCanvas,
              data: { id: state.homeConceptId },
            })
          }>
          <Home />
        </button>
      </div>
      <div className={styles.CardTitleContainer}>
        {(function () {
          const contentProps: ConceptDisplayProps<unknown> & {
            key: string
          } = {
            viewMode: 'CardTitle',
            readOnly: false,
            dispatchAction: props.dispatchAction,
            factoryRegistry: props.factoryRegistry,
            database: props.database,
            concept: state.viewingConcept,
            onChange: data =>
              props.dispatchAction({
                type: Action.ConceptWriteData,
                data: {
                  id: state.viewingConcept.id,
                  type: state.viewingConcept.summary.type,
                  content: data,
                },
              }),
            onReplace: typeId =>
              props.dispatchAction({
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
    </div>
  )
}

export const HeaderToolFactory: Factory = {
  id: 'headertool',
  name: 'Header Tool',
  isTool: true,
  component: HeaderTool,
}
