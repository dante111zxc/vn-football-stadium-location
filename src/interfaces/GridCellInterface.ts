import type { ICoordinate } from './CoordinateInterface.ts'
import type { IBoundingBox } from './BoundingBoxInterface.ts'

export interface IGridCell {
  id: string
  center: ICoordinate
  bounds: IBoundingBox
  radius: number // in kilometers
  area: number // in km²
  province?: string
  densityLevel?: 'urban' | 'suburban' | 'rural'
}
