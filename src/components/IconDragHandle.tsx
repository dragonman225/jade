import * as React from 'react'

export const IconDragHandle: React.FunctionComponent = () => {
  return (
    <>
      <style jsx>{`
        svg {
          display: block;
          fill: inherit;
          flex-shrink: 0;
          backface-visibility: hidden;
        }
      `}</style>
      <svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="10" />
        <circle cx="10" cy="50" r="10" />
        <circle cx="50" cy="50" r="10" />
        <circle cx="50" cy="10" r="10" />
      </svg>
    </>
  )
}