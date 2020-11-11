import * as React from 'react'
import { ContentProps } from '../interfaces'

export class Baby extends React.Component<ContentProps<unknown>> {
  constructor(props: ContentProps<unknown>) {
    super(props)
  }

  render(): JSX.Element {
    switch (this.props.viewMode) {
      case 'block': {
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
      default: {
        return <span>Baby</span>
      }
    }

  }
}