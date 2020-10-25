import * as React from 'react'
import { ContentProps } from '../interfaces'
import { config } from './config'

interface Props {
  contentType: string
  contentProps: ContentProps<unknown>
}

export const Content: React.FunctionComponent<Props> = (props) => {
  const contentTypeConfig = config.contentTypeRegistry[props.contentType]

  if (!contentTypeConfig) {
    return <span>
      Content type &quot;{props.contentType}&quot; does not exist in registry.
    </span>
  }

  const Component = contentTypeConfig.component
  return <Component {...props.contentProps} />
}