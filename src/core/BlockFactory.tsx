import * as React from 'react'
import { stylesheet } from 'typestyle'
import { getMouseOffset } from './lib/utils'
import { Vec2 } from './interfaces'

interface Props {
  onRequestCreate: (position: Vec2) => void
}

const styles = stylesheet({
  BlockFactory: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
})

export class BlockFactory extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
  }

  handleDoubleClick = (e: React.MouseEvent): void => {
    const offset = getMouseOffset(e)
    this.props.onRequestCreate({
      x: offset.x,
      y: offset.y
    })
  }

  render(): JSX.Element {
    return (
      <div className={styles.BlockFactory}
        onDoubleClick={this.handleDoubleClick} />
    )
  }
}