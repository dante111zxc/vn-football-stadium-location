import type { ICoordinate } from './CoordinateInterface.ts'

export interface IUrbanCenter {
  name: string
  coordinate: ICoordinate
  radius: number
}
