import * as React from 'react'
import { stylesheet } from 'typestyle'
import { ContentProps } from '../core/interfaces'
import { InitializedConceptData } from '../core/interfaces/concept'

const styles = stylesheet({
  Baby: {
    padding: '0.3rem 1.5rem',
    $nest: {
      '&>p': {
        margin: 0
      }
    }
  }
})

type Props = ContentProps<InitializedConceptData>

export const Baby: React.FunctionComponent<Props> = (props) => {
  switch (props.viewMode) {
    case 'CardTitle':
    case 'Block': {
      return <div className={styles.Baby}>
        <p>Which to turn into?</p>
        <button onClick={() => { props.onReplace('text') }}>Text</button>
        <button onClick={() => { props.onReplace('pmtext') }}>PMText</button>
        <button onClick={() => { props.onReplace('image') }}>Image</button>
        <button onClick={() => { props.onReplace('status') }}>Status</button>
      </div>
    }
    default: {
      return <div className={styles.Baby}>
        <p>Which to turn into?</p>
        <button>Text</button>
        <button>PMText</button>
        <button>Image</button>
        <button>Status</button>
      </div>
    }
  }
}