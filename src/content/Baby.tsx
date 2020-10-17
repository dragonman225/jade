import * as React from 'react'
import { BlockContentProps } from '../interfaces'

interface MoreProps {
  onReplace: (type: string) => void
}

export class Baby extends React.Component<BlockContentProps<unknown> & MoreProps> {
  constructor(props: BlockContentProps<unknown> & MoreProps) {
    super(props)
  }

  render(): JSX.Element {
    return (
      <>
        <style jsx>{`
          div {
            padding: 0.3rem 1.5rem;
          }

          p {
            margin: 0;
          }
        `}</style>
        <div>
          <p>Which to turn into?</p>
          <button onClick={() => { this.props.onReplace('text') }}>Text</button>
          <button onClick={() => { this.props.onReplace('pmtext') }}>PMText</button>
          <button onClick={() => { this.props.onReplace('image') }}>Image</button>
          <button onClick={() => { this.props.onReplace('status') }}>Status</button>
        </div>
      </>
    )
  }
}