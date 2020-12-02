import * as React from 'react'
import * as typestyle from 'typestyle'
import { IPubSub } from '../lib/pubsub'
import { UnifiedEventInfo } from '../interfaces'
import { Stroke, StrokeConfig, Point } from '../interfaces'

interface CanvasProps {
  value: Stroke[] /** Value representing a drawing. */
  readOnly?: boolean /** Whether to allow drawing. */
  /** Notify drawing changes (on a new stroke). */
  onChange?: (strokes: Stroke[]) => void
  onInteractionStart?: () => void
  onInteractionEnd?: () => void
  messenger: IPubSub
}

interface CanvasState {
  drawState: 'can_edit' | 'can_draw' | 'drawing'
  strokeConfig: 'pencil' | 'eraser'
}

const pencil: StrokeConfig = {
  lineWidth: 3,
  shadowBlur: 1,
  shadowColor: 'rgb(0, 0, 0)',
  strokeStyle: 'black',
  compositeOperation: 'source-over'
}

const eraser: StrokeConfig = {
  lineWidth: 24,
  shadowBlur: 0,
  shadowColor: 'rgb(0, 0, 0)',
  strokeStyle: 'white',
  compositeOperation: 'destination-out'
}

function resizeCanvas(el: HTMLCanvasElement, width: number, height: number) {
  el.width = width
  el.height = height
  el.style.width = `${width}px`
  el.style.height = `${height}px`
}

function clearCanvas(el: HTMLCanvasElement) {
  el.getContext('2d').clearRect(0, 0, el.width, el.height)
}

function calcMidPoint(p1: Point, p2: Point): Point {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  }
}

function drawStroke(ctx: CanvasRenderingContext2D, path: Stroke) {
  const points = path.points

  if (points.length < 2) return

  ctx.save()
  ctx.beginPath()
  ctx.lineWidth = path.config.lineWidth
  ctx.strokeStyle = path.config.strokeStyle
  ctx.shadowBlur = path.config.shadowBlur
  ctx.shadowColor = path.config.shadowColor
  ctx.globalCompositeOperation = path.config.compositeOperation
  ctx.lineJoin = ctx.lineCap = 'round'
  ctx.moveTo(points[0].x, points[0].y)

  /** Draw to the middle of the first two points. */
  const midPoint = calcMidPoint(points[0], points[1])
  ctx.lineTo(midPoint.x, midPoint.y)

  for (let i = 2; i < points.length; i++) {
    const lastPoint = points[i - 1]
    const currentPoint = points[i]
    const midPoint = calcMidPoint(lastPoint, currentPoint)

    /** To midPoint, using lastPoint as the control point. */
    ctx.quadraticCurveTo(
      lastPoint.x, lastPoint.y, midPoint.x, midPoint.y)
  }

  /** Draw to the last point. */
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
  ctx.stroke()
  ctx.closePath()
  ctx.restore()
}

function drawStrokes(ctx: CanvasRenderingContext2D, strokes: Stroke[]) {
  strokes.forEach(stroke => {
    drawStroke(ctx, stroke)
  })
}

function drawEraser(ctx: CanvasRenderingContext2D, position: Point) {
  ctx.beginPath()
  ctx.arc(position.x, position.y, eraser.lineWidth / 2, 0, 2 * Math.PI)
  ctx.stroke()
}

export class Canvas extends React.Component<CanvasProps, CanvasState> {
  refTmp: React.RefObject<HTMLCanvasElement>
  refCommited: React.RefObject<HTMLCanvasElement>
  refCursor: React.RefObject<HTMLCanvasElement>
  ctxTmp: CanvasRenderingContext2D
  ctxCommited: CanvasRenderingContext2D
  ctxCursor: CanvasRenderingContext2D
  strokes: Stroke[]
  hotStroke: Stroke

  constructor(props: CanvasProps) {
    super(props)
    this.refTmp = React.createRef<HTMLCanvasElement>()
    this.refCommited = React.createRef<HTMLCanvasElement>()
    this.refCursor = React.createRef<HTMLCanvasElement>()
    this.ctxTmp = undefined
    this.ctxCommited = undefined
    this.ctxCursor = undefined
    this.strokes = props.value
    this.hotStroke = { config: pencil, points: [] }

    this.state = {
      drawState: 'can_edit',
      strokeConfig: 'pencil'
    }
  }

  addHotPoint(x: number, y: number): void {
    this.hotStroke.points.push({ x, y })
  }

  commitStroke(): void {
    this.strokes.push(this.hotStroke)
    this.hotStroke = { config: this.state.strokeConfig === 'pencil' ? pencil : eraser, points: [] }
  }

  onResizeWindow = (): void => {
    resizeCanvas(this.refCursor.current, window.innerWidth, window.innerHeight)
    resizeCanvas(this.refTmp.current, window.innerWidth, window.innerHeight)
    resizeCanvas(this.refCommited.current,
      window.innerWidth, window.innerHeight)
    /**
     * Immediate redraw does not work. Even when I do not resize the 
     * canvas, Chrome clears it.
     */
    setTimeout(() => {
      drawStrokes(this.ctxCommited, this.strokes)
    }, 100)
  }

  onCtrlKeyDown = () => {
    if (!this.props.readOnly && this.state.drawState === 'can_edit') {
      this.setState({ drawState: 'can_draw' })
      this.props.onInteractionStart()
    }
  }

  onCtrlKeyUp = () => {
    if (this.state.drawState === 'drawing') {
      clearCanvas(this.refTmp.current)
      drawStroke(this.ctxCommited, this.hotStroke)
      this.commitStroke()
    }
    this.setState({ drawState: 'can_edit' })
    this.props.onInteractionEnd()
  }

  onDragStart = (msg: UnifiedEventInfo) => {
    if (this.state.drawState === 'can_draw') {
      this.setState({ drawState: 'drawing' })
      this.addHotPoint(msg.offsetX, msg.offsetY)
    }
  }

  onDragging = (msg: UnifiedEventInfo) => {
    if (this.state.drawState === 'drawing') {
      this.props.messenger.publish('canvas::drawing')
      this.addHotPoint(msg.offsetX, msg.offsetY)
      if (this.state.strokeConfig === 'pencil') {
        clearCanvas(this.refTmp.current)
        drawStroke(this.ctxTmp, this.hotStroke)
      } else {
        /**
         * HACK: Since the eraser uses 'destination-out', it must be drawn 
         * on the ctxCommited to take effect.
         */
        drawStroke(this.ctxCommited, this.hotStroke)
      }
    }
  }

  onDragEnd = (msg: UnifiedEventInfo) => {
    if (this.state.drawState === 'drawing') {
      this.setState({ drawState: 'can_draw' })
      this.addHotPoint(msg.offsetX, msg.offsetY)
      clearCanvas(this.refTmp.current)
      drawStroke(this.ctxCommited, this.hotStroke)
      this.commitStroke()
      if (this.props.onChange) this.props.onChange(this.strokes)
    }
  }

  onMouseMove = (msg: UnifiedEventInfo): void => {
    clearCanvas(this.refCursor.current)
    if ((this.state.drawState === 'can_draw'
      || this.state.drawState === 'drawing')
      && this.state.strokeConfig === 'eraser')
      drawEraser(this.ctxCursor, {
        x: msg.offsetX,
        y: msg.offsetY
      })
  }

  componentDidMount(): void {
    this.ctxTmp = this.refTmp.current.getContext('2d')
    this.ctxCommited = this.refCommited.current.getContext('2d')
    this.ctxCursor = this.refCursor.current.getContext('2d')

    drawStrokes(this.ctxCommited, this.strokes)

    this.props.messenger.subscribe('user::resizewindow', this.onResizeWindow)
    this.props.messenger.subscribe('user::ctrlkeydown', this.onCtrlKeyDown)
    this.props.messenger.subscribe('user::ctrlkeyup', this.onCtrlKeyUp)
    this.props.messenger.subscribe('user::dragstart', this.onDragStart)
    this.props.messenger.subscribe('user::dragging', this.onDragging)
    this.props.messenger.subscribe('user::dragend', this.onDragEnd)
    this.props.messenger.subscribe('user::mousemove', this.onMouseMove)
  }

  componentWillUnmount(): void {
    this.props.messenger.unsubscribe('user::resizewindow', this.onResizeWindow)
    this.props.messenger.unsubscribe('user::ctrlkeydown', this.onCtrlKeyDown)
    this.props.messenger.unsubscribe('user::ctrlkeyup', this.onCtrlKeyUp)
    this.props.messenger.unsubscribe('user::dragstart', this.onDragStart)
    this.props.messenger.unsubscribe('user::dragging', this.onDragging)
    this.props.messenger.unsubscribe('user::dragend', this.onDragEnd)
    this.props.messenger.unsubscribe('user::mousemove', this.onMouseMove)
  }

  toggleStroke = (): void => {
    if (this.state.strokeConfig === 'pencil') {
      this.setState({ strokeConfig: 'eraser' })
      this.hotStroke.config = eraser
    } else {
      this.setState({ strokeConfig: 'pencil' })
      this.hotStroke.config = pencil
    }
  }

  render(): JSX.Element {
    const styles = {
      Canvas: typestyle.style({
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10000,
        pointerEvents: 'none'
      })
    }
    return <>
      <canvas
        ref={this.refCommited}
        className={styles.Canvas}
        width={window.innerWidth}
        height={window.innerHeight} />
      <canvas
        ref={this.refTmp}
        className={styles.Canvas}
        width={window.innerWidth}
        height={window.innerHeight} />
      <canvas
        ref={this.refCursor}
        className={styles.Canvas}
        width={window.innerWidth}
        height={window.innerHeight} />
      {
        (
          this.state.drawState === 'can_draw' ||
          this.state.drawState === 'drawing'
        ) ?
          (
            <div
              className="toolbar"
              /** Prevent drawing under toolbar. */
              onMouseDown={(e) => { e.stopPropagation() }}>
              <style jsx>{`
                :global(body) {
                  cursor: ${this.state.drawState === 'can_draw' || this.state.drawState === 'drawing' ? this.state.strokeConfig === 'eraser' ? 'none' : 'crosshair' : 'auto'}
                }

                .toolbar {
                  position: absolute;
                  top: 1rem;
                  right: 1rem;
                  font-size: 1rem;
                  background: rgba(0, 0, 0, 0);
                }

                .toolbar button {
                  padding: .2em .5em;
                  transition: background 0.25s;
                }

                .toolbar button, .toolbar button:active {
                  outline: none;
                  border: none;
                }

                .toolbar button:first-child {
                  border-radius: .5rem 0 0 .5rem;
                }

                .toolbar button:last-child {
                  border-radius: 0 .5rem .5rem 0;
                }

                .toolbar button.active {
                  background: aquamarine;
                }
              `}</style>
              <button
                className={this.state.strokeConfig === 'pencil' ? 'active' : ''}
                onClick={this.toggleStroke}>
                Pencil
              </button>
              <button
                className={this.state.strokeConfig === 'eraser' ? 'active' : ''}
                onClick={this.toggleStroke}>
                Eraser
              </button>
            </div>
          ) : <></>
      }
    </>
  }
}