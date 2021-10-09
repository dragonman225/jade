import { Element } from 'slate'
import { RenderElementProps, RenderLeafProps } from 'slate-react'

export interface TypedElement extends Element {
  type: string
}

export interface JadeRenderLeafProps extends RenderLeafProps {
  leaf: {
    text: string
    bold?: boolean
    code?: boolean
    italic?: boolean
    underline?: boolean
  }
}

export interface JadeRenderElementProps extends RenderElementProps {
  element: TypedElement
}
