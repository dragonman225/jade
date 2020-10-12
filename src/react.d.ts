// See https://github.com/vercel/styled-jsx/issues/90#issuecomment-318052994
import 'react'

declare module 'react' {
  interface StyleHTMLAttributes<T> extends React.HTMLAttributes<T> {
    jsx?: boolean
    global?: boolean
  }
}