import * as React from 'react'
import { ContentProps } from '../core/interfaces'
import { InitializedConceptData } from '../core/interfaces/concept'

export class Baby extends React.Component<ContentProps<InitializedConceptData>> {
  constructor(props: ContentProps<InitializedConceptData>) {
    super(props)
  }

  render(): JSX.Element {
    switch (this.props.viewMode) {
      case 'CardTitle':
      case 'Block': {
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
              <button>Text</button>
              <button>PMText</button>
              <button>Image</button>
              <button>Status</button>
            </div>
          </>
        )
      }
    }

  }
}