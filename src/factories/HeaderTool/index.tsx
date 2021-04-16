import * as React from 'react'
import { stylesheet } from 'typestyle'
import { IconHome } from '../../core/component/IconHome'
import { Content } from '..'
import { ContentProps, InitializedConceptData } from '../../core/interfaces'

type Props = ContentProps<undefined>

const styles = stylesheet({
  HeaderTool: {
    width: '100%',
    display: 'flex',
    flexWrap: 'nowrap',
    padding: '0px 22px',
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

export const HeaderTool: React.FunctionComponent<Props> = props => {
  return (
    <div className={styles.HeaderTool}>
      <div className={styles.HomeBtnContainer}>
        <button
          className={styles.HomeBtn}
          onClick={() =>
            props.app.dispatch({
              type: 'navigation::expand',
              data: { id: props.app.state.homeConceptId },
            })
          }>
          <IconHome />
        </button>
      </div>
      <div className={styles.CardTitleContainer}>
        {(function () {
          const contentProps: ContentProps<InitializedConceptData> & {
            key: string
          } = {
            viewMode: 'CardTitle',
            readOnly: false,
            app: props.app,
            database: props.database,
            content: props.app.state.viewingConcept.summary.data,
            messageBus: props.messageBus,
            onChange: data =>
              props.app.dispatch({
                type: 'concept::datachange',
                data: {
                  id: props.app.state.viewingConcept.id,
                  type: props.app.state.viewingConcept.summary.type,
                  content: data,
                },
              }),
            onReplace: typeId =>
              props.app.dispatch({
                type: 'concept::datachange',
                data: {
                  id: props.app.state.viewingConcept.id,
                  type: typeId,
                  content: { initialized: false },
                },
              }),
            onInteractionStart: () => {
              return
            },
            onInteractionEnd: () => {
              return
            },
            key: 'CardTitle-' + props.app.state.viewingConcept.id,
          }
          return (
            <Content
              contentType={props.app.state.viewingConcept.summary.type}
              contentProps={contentProps}
            />
          )
        })()}
      </div>
    </div>
  )
}
