import * as React from 'react'
import * as typestyle from 'typestyle'
import { Content } from '../content/Content'
import {
  BaseContent, BlockCard, ContentProps, InitializedContent
} from '../interfaces'
import { ISub } from '../lib/pubsub'
import { Box } from './component/Box'
import { IconHome } from './component/IconHome'

interface Props {
  concept: BlockCard
  readOnlyMessenger: ISub
  onHomeClick: () => void
  onConceptEdit: (data: BaseContent) => void
  onConceptReplace: (typeId: string) => void
}

const styles = {
  HeaderTool: typestyle.style({
    width: '100%',
    maxHeight: 200,
    display: 'flex',
    flexWrap: 'nowrap',
    padding: '0px 22px'
  }),
  HomeBtnContainer: typestyle.style({
    flex: '0 0 50px',
    height: 50,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }),
  HomeBtn: typestyle.style({
    width: 30,
    height: 30,
    fill: '#000',
    transition: 'transform 0.2s ease-in-out',
    border: 'none',
    background: 'unset',
    $nest: {
      '&:hover': {
        transform: 'scale(1.2)'
      },
      '&:active': {
        transform: 'scale(0.9)'
      },
      '&:focus': {
        outline: 'none'
      }
    }
  }),
  CardTitleContainer: typestyle.style({
    flex: '1 1 50px',
    overflow: 'hidden',
    display: 'flex'
  })
}

export const HeaderTool: React.FunctionComponent<Props> = (props) => {
  return (
    <div className={styles.HeaderTool}>
      <div className={styles.HomeBtnContainer}>
        <button className={styles.HomeBtn} onClick={props.onHomeClick}>
          <IconHome />
        </button>
      </div>
      <div className={styles.CardTitleContainer}>
        {
          function () {
            const contentProps: ContentProps<InitializedContent> & { key: string } = {
              viewMode: 'CardTitle',
              readOnly: false,
              content: props.concept.content,
              messageBus: props.readOnlyMessenger,
              onChange: props.onConceptEdit,
              onReplace: props.onConceptReplace,
              onInteractionStart: () => { return },
              onInteractionEnd: () => { return },
              key: 'CardTitle-' + props.concept.id
            }
            return <Content contentType={props.concept.type}
              contentProps={contentProps} />
          }()
        }
      </div>
    </div>
  )
}