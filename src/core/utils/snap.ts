import { Box } from '../interfaces'
import { isBoxBoxIntersectingObjVer } from './math'

/**
 * Use `valueOf()` as the unified interface to get the value of the
 * guideline, so that simple `number[]` works, and if you want to add
 * additional information to the guideline, like in `GuidelineFromRect`,
 * also works.
 */
export interface Guideline {
  valueOf: () => number
}

/**
 * Report the value to snap to and which guideline produces the value.
 * If the value is not from any guideline, i.e. passing through the input
 * value, `guideline` is `undefined`.
 */
export interface SnapResult<UserGuideline> {
  value: number
  guideline: UserGuideline | undefined
}

/** Try to snap a value to a guideline. */
export function snapValue<UserGuideline extends Guideline>(
  input: number,
  guidelines: UserGuideline[],
  tolerance: number
): SnapResult<UserGuideline> {
  let output: SnapResult<UserGuideline> = { value: input, guideline: undefined }

  for (let i = 0; i < guidelines.length; i += 1) {
    const guideline = guidelines[i]
    const diff = Math.abs(input - guideline.valueOf())
    if (diff < tolerance) {
      tolerance = diff
      output = { value: guideline.valueOf(), guideline }
    }
  }

  return output
}

export enum RectSide {
  Top = 'top',
  Right = 'right',
  Bottom = 'bottom',
  Left = 'left',
}

export interface GuidelineFromRect extends Guideline {
  fromSide: RectSide
}

/**
 * Generate guidelines from rects.
 *
 * Using bounding box to test intersection finds out the union of
 * intersections produced by individual cursor rects and some intersections
 * with only the bounding box.
 */
export function generateGuidelinesFromRects(
  cursorRectsBoundingBox: Box,
  targetRects: Box[],
  tolerance: number
): {
  horizontalGuidelines: GuidelineFromRect[]
  verticalGuidelines: GuidelineFromRect[]
} {
  const horizontalGuidelines: GuidelineFromRect[] = []
  const verticalGuidelines: GuidelineFromRect[] = []

  for (let i = 0; i < targetRects.length; i += 1) {
    const targetRect = targetRects[i]
    const detectionRect = {
      x: targetRect.x - tolerance,
      y: targetRect.y - tolerance,
      w: targetRect.w + 2 * tolerance,
      h: targetRect.h + 2 * tolerance,
    }
    if (isBoxBoxIntersectingObjVer(cursorRectsBoundingBox, detectionRect)) {
      horizontalGuidelines.push(
        { valueOf: () => targetRect.y, fromSide: RectSide.Top },
        {
          valueOf: () => targetRect.y + targetRect.h,
          fromSide: RectSide.Bottom,
        }
      )
      verticalGuidelines.push(
        { valueOf: () => targetRect.x, fromSide: RectSide.Left },
        { valueOf: () => targetRect.x + targetRect.w, fromSide: RectSide.Right }
      )
    }
  }

  return { horizontalGuidelines, verticalGuidelines }
}
