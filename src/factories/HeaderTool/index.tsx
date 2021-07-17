import * as React from 'react'
import { stylesheet } from 'typestyle'

import { Home } from '../../core/components/icons/Home'
import { Action } from '../../core/store/actions'
import {
  ConceptDisplayProps,
  Factory,
  InitializedConceptData,
} from '../../core/interfaces'

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
              data: { id: props.state.homeConceptId },
            })
          }>
          <Home />
        </button>
      </div>
      <div className={styles.CardTitleContainer}>
        {(function () {
          const contentProps: ConceptDisplayProps<InitializedConceptData> & {
            key: string
          } = {
            viewMode: 'CardTitle',
            readOnly: false,
            state: props.state,
            dispatchAction: props.dispatchAction,
            factoryRegistry: props.factoryRegistry,
            database: props.database,
            concept: props.state.viewingConcept,
            onChange: data =>
              props.dispatchAction({
                type: Action.ConceptWriteData,
                data: {
                  id: props.state.viewingConcept.id,
                  type: props.state.viewingConcept.summary.type,
                  content: data,
                },
              }),
            onReplace: typeId =>
              props.dispatchAction({
                type: Action.ConceptWriteData,
                data: {
                  id: props.state.viewingConcept.id,
                  type: typeId,
                  content: { initialized: false },
                },
              }),
            onInteractionStart,
            onInteractionEnd,
            key: 'CardTitle-' + props.state.viewingConcept.id,
          }

          return props.factoryRegistry.createConceptDisplay(
            props.state.viewingConcept.summary.type,
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
