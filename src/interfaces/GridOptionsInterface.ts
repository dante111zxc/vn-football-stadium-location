export interface IGridOptions {
  defaultCellSize?: number // kilometers
  urbanCellSize?: number
  suburbanCellSize?: number
  ruralCellSize?: number
  overlap?: number // percentage overlap between cells
  minRadius?: number // minimum search radius in km
  maxRadius?: number // maximum search radius in km
}
