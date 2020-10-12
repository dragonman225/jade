import { Vec2 } from '../interfaces'

export function getMouseOffset(e: React.MouseEvent): Vec2 {
  const rect = e.currentTarget.getBoundingClientRect()
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
}