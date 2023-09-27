// Copyright (c) 2021 Alexander Wang <alexwang.maker@gmail.com>
// SPDX-License-Identifier: MIT

import { useRef } from 'react'

function assert(mayBeFunction?: unknown) {
  if (typeof mayBeFunction !== 'function' && mayBeFunction != null) {
    console.log(mayBeFunction)
    throw new Error(
      'It is now allowed to pass in a thing that is not a function, ' +
        'undefined, or null to useFunctionRef'
    )
  }
}

/**
 * `React.useRef` for functions.
 *
 * If `undefined` or `null` is passed in, `current` returns a dummy
 * function, so `current` is always callable.
 */
export function useFunctionRef<T>(initialFunction?: T): { current: T } {
  assert(initialFunction)
  const r = useRef(
    (() => {
      const dummyFn = (() => {
        return
      }) as unknown as T
      let fn = initialFunction || dummyFn
      return {
        get current() {
          return fn
        },
        set current(newFn) {
          assert(newFn)
          fn = newFn || dummyFn
        },
      }
    })()
  )
  return r.current
}
