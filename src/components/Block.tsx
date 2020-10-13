import * as React from 'react'
import { IPubSub } from '../lib/pubsub'
import { IconDragHandle } from './IconDragHandle'
import { IconCross } from './IconCross'
import { IconExpand } from './IconExpand'
import { UnifiedEventInfo, BlockModel, BlockContentProps } from '../interfaces'

interface Props {
  readOnly: boolean
  value: BlockModel<unknown>
  onChange: (data: BlockModel<unknown>) => void
  onRemove: () => void
  onExpand: () => void
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
  messenger: IPubSub
  children?: (props: Omit<BlockContentProps, 'viewMode'>) => JSX.Element
}

interface State {
  moving: boolean
  editing: boolean
  resizing: boolean
  mouseIsInside: boolean
  dragPosition: { x: number; y: number }
  lastDragPosition: { x: number; y: number }
}

const dragAreaSize = 22

export class Block extends React.Component<Props, State> {
  ref: React.RefObject<HTMLDivElement>
  _isMounted: boolean // for the tricky remove

  constructor(props: Props) {
    super(props)
    this.state = {
      moving: false,
      editing: false,
      resizing: false,
      mouseIsInside: false,
      dragPosition: { x: 0, y: 0 },
      lastDragPosition: { x: 0, y: 0 }
    }

    /** For inResizeArea() to getBoundingClientRect(). */
    this.ref = React.createRef<HTMLDivElement>()
  }

  inDragArea(x: number, y: number): boolean {
    if (x > this.props.value.position.x && x < this.props.value.position.x + dragAreaSize
      && y > this.props.value.position.y && y < this.props.value.position.y + dragAreaSize) {
      return true
    } else return false
  }

  inResizeArea(x: number, y: number): boolean {
    const blockRect = this.ref.current.getBoundingClientRect()
    const resizeRect = {
      top: blockRect.bottom - dragAreaSize,
      left: blockRect.right - dragAreaSize,
      bottom: blockRect.bottom,
      right: blockRect.right
    }
    if (x < resizeRect.right && x > resizeRect.left && y > resizeRect.top && y < resizeRect.bottom) return true
    else return false
  }

  handleDragStart = (msg: UnifiedEventInfo): void => {
    if (this.inDragArea(msg.offsetX, msg.offsetY) && this.state.mouseIsInside) {
      this.setState({ moving: true })
      this.props.onInteractionStart()
    }
    if (this.inResizeArea(msg.offsetX, msg.offsetY) && this.state.mouseIsInside) {
      this.setState({ resizing: true })
      this.props.onInteractionStart()
    }
    this.state.dragPosition.x = msg.offsetX - this.props.value.position.x
    this.state.dragPosition.y = msg.offsetY - this.props.value.position.y
    this.state.lastDragPosition.x = msg.offsetX
    this.state.lastDragPosition.y = msg.offsetY
  }

  handleDragging = (msg: UnifiedEventInfo): void => {
    if (this.state.moving) {
      const newPos = {
        x: msg.offsetX - this.state.dragPosition.x,
        y: msg.offsetY - this.state.dragPosition.y
      }
      if (newPos.x < dragAreaSize) newPos.x = dragAreaSize
      if (newPos.y < 0) newPos.y = 0
      this.props.onChange({
        ...this.props.value,
        position: newPos
      })
      this.props.messenger.publish('block::moving')
    }

    if (this.state.resizing) {
      const deltaX = msg.offsetX - this.state.lastDragPosition.x
      this.props.onChange({
        ...this.props.value,
        width: this.props.value.width + deltaX
      })
      this.setState({
        lastDragPosition: {
          x: msg.offsetX,
          y: msg.offsetY
        }
      })
      this.props.messenger.publish('block::resizing')
    }
  }

  handleDragEnd = (): void => {
    if (this.state.moving || this.state.resizing) {
      this.setState({ moving: false, resizing: false })
      this.props.onInteractionEnd()
    }
  }

  componentDidMount(): void {
    this._isMounted = true
    this.props.messenger.subscribe('user::dragstart', this.handleDragStart)
    this.props.messenger.subscribe('user::dragging', this.handleDragging)
    this.props.messenger.subscribe('user::dragend', this.handleDragEnd)
  }

  componentWillUnmount(): void {
    this._isMounted = false
    this.props.messenger.unsubscribe('user::dragstart', this.handleDragStart)
    this.props.messenger.unsubscribe('user::dragging', this.handleDragging)
    this.props.messenger.unsubscribe('user::dragend', this.handleDragEnd)
  }

  handleMouseEnter = (): void => {
    if (!this.props.readOnly) {
      this.setState({ mouseIsInside: true })
    }
  }

  handleMouseLeave = (): void => {
    /**
     * HACK: Not checking readOnly here, considering this case:
     * mouseEnter -> ctrlDown (activate canvas, lock blocks) -> 
     * mouseLeave -> ctrlUp (deactivate canvas, unlock blocks)
     * The desire behavior is the background being reseted, so we need to 
     * detect that "mouseLeave" even when locked.
     */
    this.setState({ mouseIsInside: false })
  }

  handleContentChange = (content: unknown): void => {
    this.props.onChange({
      ...this.props.value,
      content
    })
  }

  handleContentInteractionStart = (): void => {
    this.setState({ editing: true })
    this.props.onInteractionStart()
  }

  handleContentInteractionEnd = (): void => {
    this.setState({ editing: false })
    this.props.onInteractionEnd()
  }

  render(): JSX.Element {
    return (
      <>
        <style jsx>{`
          .Block {
            position: absolute;
            top: ${this.props.value.position.y}px;
            left: ${this.props.value.position.x}px;
            width: ${this.props.value.width}px;
            color: rgb(65, 65, 65);
            background: ${!this.props.readOnly && (this.state.mouseIsInside || this.state.resizing || this.state.moving || this.state.editing) ? 'rgba(235, 235, 235, 0.8)' : 'inherit'};
            display: flex;
            align-items: center;
            word-break: break-word;
            padding: 10px ${dragAreaSize}px;
            user-select: none;
            z-index: ${!this.props.readOnly && (this.state.mouseIsInside || this.state.resizing || this.state.moving || this.state.editing) ? '1' : 'unset'};
          }

          .handle {
            width: ${dragAreaSize}px;
            height: ${dragAreaSize}px;
            fill: #aaaaaa;
            padding: .3rem;
            background: rgba(0, 0, 0, 0);
            position: absolute;
          }

          .handle:hover, .handle:active {
            background:rgba(182, 182, 182, 0.8);
            fill: #7c7c7c;
          }

          .drag-area {
            top: 0;
            left: 0;
            cursor: ${this.state.moving ? 'grabbing' : 'grab'};
          }

          .expand-area {
            top: 0;
            right: 0;
            cursor: default;
          }

          .resize-area {
            bottom: 0;
            right: 0;
            cursor: ew-resize;
          }

          .remove-area {
            bottom: 0;
            left: 0;
            cursor: default;
          }

          .children-wrapper {
            width: 100%;
          }

          .debug-id {
            display: none;
            font-size: 6px;
            position: absolute;
            top: 0;
            left: 0;
            color: #050c9c;
            white-space: nowrap;
          }
        `}</style>
        <div
          className="Block" ref={this.ref}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          onClick={this.handleMouseEnter}>
          <span className="debug-id">{this.props.value.id}</span>
          {
            !this.props.readOnly && this.state.mouseIsInside
              ? <div className="handle drag-area"><IconDragHandle /></div>
              : <></>
          }
          {
            !this.props.readOnly && this.state.mouseIsInside
              ? <div className="handle expand-area"
                onClick={this.props.onExpand}><IconExpand /></div>
              : <></>
          }
          {
            !this.props.readOnly && this.state.mouseIsInside
              ? <div className="handle resize-area"><IconDragHandle /></div>
              : <></>
          }
          {
            !this.props.readOnly && this.state.mouseIsInside
              ? <div className="handle remove-area"
                onClick={this.props.onRemove}><IconCross /></div>
              : <></>
          }
          <div className="children-wrapper">
            {
              this.props.children
                ? this.props.children({
                  readOnly: this.props.readOnly,
                  content: this.props.value.content,
                  onChange: this.handleContentChange,
                  onInteractionStart: this.handleContentInteractionStart,
                  onInteractionEnd: this.handleContentInteractionEnd
                })
                : <></>}
          </div>
        </div>
      </>
    )
  }
}