import * as React from 'react'
import { stylesheet } from 'typestyle'
import { getMouseOffset } from './lib/utils'
import { Vec2 } from './interfaces'

interface Props {
  onRequestCreate: (position: Vec2) => void
  onPan: (delta: Vec2) => void
}

const styles = stylesheet({
  BlockFactory: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
})

export class Base extends React.Component<Props> {
  private holding: boolean
  private lastPointerPos: Vec2

  constructor(props: Props) {
    super(props)
    this.holding = false
    this.lastPointerPos = { x: 0, y: 0 }
  }

  handleDoubleClick = (e: React.MouseEvent): void => {
    const offset = getMouseOffset(e)
    this.props.onRequestCreate({
      x: offset.x,
      y: offset.y,
    })
  }

  handlePointerDown: React.PointerEventHandler = e => {
    this.holding = true
    this.lastPointerPos = { x: e.clientX, y: e.clientY }
  }

  handlePointerMove: React.PointerEventHandler = e => {
    if (this.holding) {
      const movement = {
        x: e.clientX - this.lastPointerPos.x,
        y: e.clientY - this.lastPointerPos.y,
      }
      this.lastPointerPos = { x: e.clientX, y: e.clientY }

      this.props.onPan(movement)
    }
  }

  handlePointerUp: React.PointerEventHandler = () => {
    this.holding = false
    this.lastPointerPos = { x: 0, y: 0 }
  }

  render(): JSX.Element {
    return (
      <div
        className={styles.BlockFactory}
        onDoubleClick={this.handleDoubleClick}
        onPointerDown={this.handlePointerDown}
        onPointerMove={this.handlePointerMove}
        onPointerUp={this.handlePointerUp}
      />
    )
  }
}
