import * as React from 'react'
import { Baby } from './Baby'
import { Image } from './Image'
import { PMText } from './PMText'
import { Status } from './Status'
import { Text } from './Text'
import { BlockContentProps } from '../interfaces'

interface Props {
  contentType: string
  contentProps: BlockContentProps<unknown>
}

export const Content: React.FunctionComponent<Props> = (props) => {
  switch (props.contentType) {
    case 'image':
      return <Image {...props.contentProps} />
    case 'pmtext':
      return <PMText {...props.contentProps} />
    case 'status':
      return <Status {...props.contentProps} />
    case 'text':
      return <Text {...props.contentProps} />
    case 'baby':
    default:
      return <Baby {...props.contentProps} />
  }
}