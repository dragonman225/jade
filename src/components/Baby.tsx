import * as React from 'react'
import { BlockContentProps } from '../interfaces'

interface MoreProps {
  onReplace: (type: string, content: unknown) => void
}

export class Baby extends React.Component<BlockContentProps<null> & MoreProps> {
  constructor(props: BlockContentProps<null> & MoreProps) {
    super(props)
  }

  render(): JSX.Element {
    return (
      <>
        <style jsx>{`
          p {
            margin: 0;
          }
        `}</style>
        <div>
          <p>Which to turn into?</p>
          <button onClick={() => { this.props.onReplace('text', null) }}>Text</button>
          <button onClick={() => { this.props.onReplace('image', { loaded: false }) }}>Image</button>
          <button onClick={() => { this.props.onReplace('status', null) }}>Status</button>
        </div>
      </>
    )
  }
}