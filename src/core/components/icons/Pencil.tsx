import * as React from 'react'
import { IconStyle } from './Icon.styles'

export const Pencil: React.FunctionComponent = () => {
  return (
    <svg
      className={IconStyle}
      width="100%"
      height="100%"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M16.6133 3.13137C17.0093 2.73535 17.2073 2.53735 17.4357 2.46316C17.6365 2.3979 17.8529 2.3979 18.0537 2.46316C18.282 2.53735 18.48 2.73535 18.8761 3.13137L20.8686 5.12395C21.2646 5.51997 21.4627 5.71797 21.5368 5.9463C21.6021 6.14715 21.6021 6.36349 21.5368 6.56434C21.4627 6.79267 21.2646 6.99067 20.8686 7.38669L7.53191 20.7234L3.27659 16.4681L16.6133 3.13137Z" />
      <path d="M4.49444 21.4244C3.66728 21.6152 3.2537 21.7107 2.96276 21.5943C2.70867 21.4927 2.50733 21.2913 2.40569 21.0372C2.28931 20.7463 2.38476 20.3327 2.57564 19.5056L3.27659 16.4681L7.53191 20.7234L4.49444 21.4244Z" />
    </svg>
  )
}
