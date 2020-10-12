import * as React from 'react'
import { IPubSub } from '../lib/pubsub'
import { getMouseOffset } from '../lib/utils'

interface Props {
  messenger: IPubSub
}

export class BlockFactory extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
  }

  handleDoubleClick = (e: React.MouseEvent): void => {
    const offset = getMouseOffset(e)
    this.props.messenger.publish('user::createBlock', {
      clientX: e.clientX,
      clientY: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y
    })
  }

  render(): JSX.Element {
    return (
      <>
        <style jsx>{`
          .BlockFactory {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
          }
        `}</style>
        <div className="BlockFactory" onDoubleClick={this.handleDoubleClick} />
      </>
    )
  }
}