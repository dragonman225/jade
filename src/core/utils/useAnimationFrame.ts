import { useRef, useEffect } from 'react'

export function useAnimationFrame(callback: (deltaTime: number) => void): void {
  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const rRAFId = useRef<number | undefined>()
  const previousTimeRef = useRef<number>()

  const animate = (time: number) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current
      callback(deltaTime)
    }
    previousTimeRef.current = time
    rRAFId.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    rRAFId.current = requestAnimationFrame(animate)
    return () => {
      if (rRAFId.current) cancelAnimationFrame(rRAFId.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Make sure the effect runs only once
}
