import { test } from 'zora'
import { cartesianCoordsToPolarCoords } from '../src/core/utils'

void test('should convert cartesian coords to polar coords', t => {
  /** We need to round due to floating point precision issue of IEEE754. */
  t.deepEqual(
    cartesianCoordsToPolarCoords(1, Math.sqrt(3)).map(n => Math.round(n)),
    [2, 60],
    '(1, √3)'
  )
  t.deepEqual(
    cartesianCoordsToPolarCoords(-1, Math.sqrt(3)).map(n => Math.round(n)),
    [2, 120],
    '(-1, √3)'
  )
  t.deepEqual(
    cartesianCoordsToPolarCoords(-1, -Math.sqrt(3)).map(n => Math.round(n)),
    [2, 240],
    '(-1, -√3)'
  )
  t.deepEqual(
    cartesianCoordsToPolarCoords(1, -Math.sqrt(3)).map(n => Math.round(n)),
    [2, 300],
    '(1, -√3)'
  )
})
