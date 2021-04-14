import * as React from 'react'
import { stylesheet } from 'typestyle'
import { IconHome } from './component/IconHome'
import { ISub } from './lib/pubsub'
import { Content } from '../content-plugins'
import { ContentProps } from './interfaces'
import {
  Concept,
  BaseConceptData,
  InitializedConceptData,
} from './interfaces/concept'

interface Props {
  concept: Concept
  readOnlyMessenger: ISub
  onHomeClick: () => void
  onConceptEdit: (data: BaseConceptData) => void
  onConceptReplace: (typeId: string) => void
}

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
        <button className={styles.HomeBtn} onClick={props.onHomeClick}>
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
            content: props.concept.summary.data,
            messageBus: props.readOnlyMessenger,
            onChange: props.onConceptEdit,
            onReplace: props.onConceptReplace,
            onInteractionStart: () => {
              return
            },
            onInteractionEnd: () => {
              return
            },
            key: 'CardTitle-' + props.concept.id,
          }
          return (
            <Content
              contentType={props.concept.summary.type}
              contentProps={contentProps}
            />
          )
        })()}
      </div>
    </div>
  )
}
