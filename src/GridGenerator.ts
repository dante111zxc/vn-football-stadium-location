/**
 * GridGenerator Class
 * Generates geographical grid coordinates for Vietnam
 * Supports adaptive grid sizing based on population density
 */

import type { ICoordinate } from './interfaces/CoordinateInterface.ts'
import type { IBoundingBox } from './interfaces/BoundingBoxInterface.ts'
import type { IGridCell } from './interfaces/GridCellInterface.ts'
import type { IGridOptions } from './interfaces/GridOptionsInterface.ts'
import type { IUrbanCenter } from './interfaces/UrbanCenterInterface.ts'
import { VIETNAM_BOUNDS, URBAN_CENTERS } from './config/constants.js'

export class GridGenerator {
  private options: Required<IGridOptions>
  private gridCells: IGridCell[] = []

  constructor(options: IGridOptions = {}) {
    this.options = {
      defaultCellSize: options.defaultCellSize ?? 20,
      urbanCellSize: options.urbanCellSize ?? 10,
      suburbanCellSize: options.suburbanCellSize ?? 10,
      ruralCellSize: options.ruralCellSize ?? 20,
      overlap: options.overlap ?? 10, // 10% overlap
      minRadius: options.minRadius ?? 1.5,
      maxRadius: options.maxRadius ?? 5,
    }
  }

  /**
   * Tạo lưới tọa độ phủ toàn bộ lãnh thổ Việt Nam phục vụ tìm kiếm sân bóng.
   *
   * TÁC DỤNG:
   * - Chia Việt Nam thành các ô lưới (grid cells) để gọi API tìm kiếm theo từng vùng
   * - Dùng lưới thích ứng: ô nhỏ ở thành phố lớn (urban), ô vừa ở ngoại ô (suburban), ô lớn ở nông thôn (rural)
   * - Mỗi ô có tâm, bounds, bán kính tìm kiếm để GMapsExtractor/Places API query theo vị trí
   *
   * LOGIC TỔNG QUAN:
   * 1. Tính bước nhảy (step) theo độ dựa trên kích thước ô và overlap
   * 2. Duyệt lưới theo vĩ độ (lat) rồi kinh độ (lng) từ ranh giới VIETNAM_BOUNDS
   * 3. Loại bỏ điểm ngoài lãnh thổ (biển, vùng nước)
   * 4. Xác định mật độ (urban/suburban/rural) theo khoảng cách đến 10 thành phố lớn
   * 5. Điều chỉnh kích thước ô theo mật độ
   * 6. Tinh chỉnh vùng đô thị: thay ô lớn bằng các ô nhỏ hơn
   */
  public generateVietnamGrid(): IGridCell[] {
    this.gridCells = []

    // --- BƯỚC 1: Khởi tạo tham số lưới cơ sở ---
    const cellSizeKm = this.options.defaultCellSize
    const overlapFactor = 1 - this.options.overlap / 100

    // Chuyển km sang độ: 1° vĩ độ ≈ 111km; kinh độ thay đổi theo vĩ độ (cos(lat))
    const latStepDegrees = this.kmToLatDegrees(cellSizeKm * overlapFactor)

    let cellId = 0

    // --- BƯỚC 2: Duyệt lưới theo vĩ độ (Bắc-Nam) ---
    for (
      let lat = VIETNAM_BOUNDS.south;
      lat <= VIETNAM_BOUNDS.north;
      lat += latStepDegrees
    ) {
      // Kinh độ 1° khác nhau theo vĩ độ: càng xa xích đạo, 1° lng càng ngắn (tính theo cos(lat))
      const adjustedLngStep = this.kmToLngDegrees(
        cellSizeKm * overlapFactor,
        lat
      )

      // --- BƯỚC 3: Duyệt lưới theo kinh độ (Tây-Đông) ---
      for (
        let lng = VIETNAM_BOUNDS.west;
        lng <= VIETNAM_BOUNDS.east;
        lng += adjustedLngStep
      ) {
        const center: ICoordinate = { latitude: lat, longitude: lng }

        // --- BƯỚC 4: Lọc điểm ngoài lãnh thổ ---
        // Loại vịnh Bắc Bộ, biển Đông và các vùng ngoài bounding box
        if (!this.isApproximatelyInVietnam(center)) {
          continue
        }

        // --- BƯỚC 5: Xác định mật độ theo khoảng cách đến URBAN_CENTERS ---
        // urban: trong 40% bán kính; suburban: 40–80%; rural: ngoài 80%
        const densityLevel = this.getDensityLevel(center)

        // --- BƯỚC 6: Điều chỉnh kích thước ô theo mật độ ---
        let actualCellSize = cellSizeKm
        if (densityLevel === 'urban') {
          actualCellSize = this.options.urbanCellSize
        } else if (densityLevel === 'suburban') {
          actualCellSize = this.options.suburbanCellSize
        } else {
          actualCellSize = this.options.ruralCellSize
        }

        // Bán kính tìm kiếm: clamp giữa minRadius và maxRadius
        const radius = Math.max(
          this.options.minRadius,
          Math.min(actualCellSize / 2, this.options.maxRadius)
        )

        // --- BƯỚC 7: Tính bounds (4 góc) của ô ---
        const halfSize = actualCellSize / 2
        const bounds: IBoundingBox = {
          north: lat + this.kmToLatDegrees(halfSize),
          south: lat - this.kmToLatDegrees(halfSize),
          east: lng + this.kmToLngDegrees(halfSize, lat),
          west: lng - this.kmToLngDegrees(halfSize, lat),
        }

        this.gridCells.push({
          id: `grid_${String(cellId).padStart(6, '0')}`,
          center,
          bounds,
          radius,
          area: actualCellSize * actualCellSize,
          densityLevel,
        })

        cellId++
      }
    }

    // --- BƯỚC 8: Tinh chỉnh vùng đô thị ---
    // Thay các ô lớn trong bán kính thành phố bằng ô nhỏ hơn (urbanCellSize)
    this.refineUrbanAreas()

    console.log(`Generated ${this.gridCells.length} grid cells`)
    return this.gridCells
  }

  /**
   * Generate grid for specific bounding box
   */
  public generateCustomGrid(
    bounds: IBoundingBox,
    cellSizeKm: number
  ): IGridCell[] {
    const cells: IGridCell[] = []
    const overlapFactor = 1 - this.options.overlap / 100

    const latStepDegrees = this.kmToLatDegrees(cellSizeKm * overlapFactor)

    let cellId = 0

    for (let lat = bounds.south; lat <= bounds.north; lat += latStepDegrees) {
      const adjustedLngStep = this.kmToLngDegrees(
        cellSizeKm * overlapFactor,
        lat
      )

      for (let lng = bounds.west; lng <= bounds.east; lng += adjustedLngStep) {
        const center: ICoordinate = { latitude: lat, longitude: lng }
        const radius = cellSizeKm / 2

        const halfSize = cellSizeKm / 2
        const cellBounds: IBoundingBox = {
          north: lat + this.kmToLatDegrees(halfSize),
          south: lat - this.kmToLatDegrees(halfSize),
          east: lng + this.kmToLngDegrees(halfSize, lat),
          west: lng - this.kmToLngDegrees(halfSize, lat),
        }

        cells.push({
          id: `custom_${String(cellId).padStart(6, '0')}`,
          center,
          bounds: cellBounds,
          radius,
          area: cellSizeKm * cellSizeKm,
        })

        cellId++
      }
    }

    return cells
  }

  /**
   * Generate grid for specific province/city
   */
  public generateProvinceGrid(
    provinceName: string,
    provinceBounds: IBoundingBox
  ): IGridCell[] {
    const cells = this.generateCustomGrid(
      provinceBounds,
      this.options.defaultCellSize
    )

    // Mark cells with province name
    cells.forEach((cell) => {
      cell.province = provinceName
    })

    return cells
  }

  /**
   * Get all generated grid cells
   */
  public getIGridCells(): IGridCell[] {
    return this.gridCells
  }

  /**
   * Get grid cells by density level
   */
  public getCellsByDensity(
    densityLevel: 'urban' | 'suburban' | 'rural'
  ): IGridCell[] {
    return this.gridCells.filter((cell) => cell.densityLevel === densityLevel)
  }

  /**
   * Export grid to JSON
   */
  public exportToJSON(): string {
    return JSON.stringify(
      {
        metadata: {
          totalCells: this.gridCells.length,
          generatedAt: new Date().toISOString(),
          options: this.options,
          coverage: VIETNAM_BOUNDS,
        },
        cells: this.gridCells,
      },
      null,
      2
    )
  }

  /**
   * Calculate statistics
   */
  public getStatistics(): {
    totalCells: number
    urbanCells: number
    suburbanCells: number
    ruralCells: number
    totalArea: number
    averageRadius: number
  } {
    const urban = this.gridCells.filter(
      (c) => c.densityLevel === 'urban'
    ).length
    const suburban = this.gridCells.filter(
      (c) => c.densityLevel === 'suburban'
    ).length
    const rural = this.gridCells.filter(
      (c) => c.densityLevel === 'rural'
    ).length
    const totalArea = this.gridCells.reduce((sum, cell) => sum + cell.area, 0)
    const avgRadius =
      this.gridCells.reduce((sum, cell) => sum + cell.radius, 0) /
      this.gridCells.length

    return {
      totalCells: this.gridCells.length,
      urbanCells: urban,
      suburbanCells: suburban,
      ruralCells: rural,
      totalArea,
      averageRadius: avgRadius,
    }
  }

  /**
   * Refine urban areas with smaller, denser grid
   */
  private refineUrbanAreas(): void {
    const urbanCells: IGridCell[] = []
    let urbanCellId = this.gridCells.length

    URBAN_CENTERS.forEach((center: IUrbanCenter) => {
      const cellSizeKm = this.options.urbanCellSize
      const overlapFactor = 1 - this.options.overlap / 100
      const latStepDegrees = this.kmToLatDegrees(cellSizeKm * overlapFactor)

      // Create smaller grid around urban center
      const urbanBounds: IBoundingBox = {
        north: center.coordinate.latitude + this.kmToLatDegrees(center.radius),
        south: center.coordinate.latitude - this.kmToLatDegrees(center.radius),
        east:
          center.coordinate.longitude +
          this.kmToLngDegrees(center.radius, center.coordinate.latitude),
        west:
          center.coordinate.longitude -
          this.kmToLngDegrees(center.radius, center.coordinate.latitude),
      }

      for (
        let lat = urbanBounds.south;
        lat <= urbanBounds.north;
        lat += latStepDegrees
      ) {
        const adjustedLngStep = this.kmToLngDegrees(
          cellSizeKm * overlapFactor,
          lat
        )

        for (
          let lng = urbanBounds.west;
          lng <= urbanBounds.east;
          lng += adjustedLngStep
        ) {
          const cellCenter: ICoordinate = { latitude: lat, longitude: lng }

          // Check if within urban radius
          const distance = this.haversineDistance(cellCenter, center.coordinate)
          if (distance > center.radius) continue

          const radius = cellSizeKm / 2
          const halfSize = cellSizeKm / 2
          const bounds: IBoundingBox = {
            north: lat + this.kmToLatDegrees(halfSize),
            south: lat - this.kmToLatDegrees(halfSize),
            east: lng + this.kmToLngDegrees(halfSize, lat),
            west: lng - this.kmToLngDegrees(halfSize, lat),
          }

          urbanCells.push({
            id: `urban_${String(urbanCellId).padStart(6, '0')}`,
            center: cellCenter,
            bounds,
            radius,
            area: cellSizeKm * cellSizeKm,
            densityLevel: 'urban',
          })

          urbanCellId++
        }
      }

      // Remove larger cells that overlap with urban cells
      this.gridCells = this.gridCells.filter((cell) => {
        const distance = this.haversineDistance(cell.center, center.coordinate)
        return distance > center.radius
      })
    })

    // Add urban cells
    this.gridCells.push(...urbanCells)
  }

  /**
   * Determine density level based on proximity to urban centers
   */
  private getDensityLevel(
    coordinate: ICoordinate
  ): 'urban' | 'suburban' | 'rural' {
    for (const center of URBAN_CENTERS) {
      const distance = this.haversineDistance(coordinate, center.coordinate)

      if (distance <= center.radius * 0.4) {
        return 'urban'
      } else if (distance <= center.radius * 0.8) {
        return 'suburban'
      }
    }

    return 'rural'
  }

  /**
   * Basic check if coordinate is approximately in Vietnam
   */
  private isApproximatelyInVietnam(coordinate: ICoordinate): boolean {
    // Simple bounding box check
    if (
      coordinate.latitude < VIETNAM_BOUNDS.south ||
      coordinate.latitude > VIETNAM_BOUNDS.north ||
      coordinate.longitude < VIETNAM_BOUNDS.west ||
      coordinate.longitude > VIETNAM_BOUNDS.east
    ) {
      return false
    }

    // Additional checks to exclude water bodies (Gulf of Tonkin, South China Sea)
    // This is a simplified check - for production, use proper polygon checking

    // Exclude Gulf of Tonkin (west side)
    if (coordinate.longitude < 104 && coordinate.latitude > 20) {
      return false
    }

    // Exclude South China Sea (east side)
    if (coordinate.longitude > 108 && coordinate.latitude < 12) {
      return false
    }

    return true
  }

  /**
   * Convert kilometers to latitude degrees
   * 1 degree latitude ≈ 111 km
   */
  private kmToLatDegrees(km: number): number {
    return km / 111.0
  }

  /**
   * Convert kilometers to longitude degrees
   * Varies by latitude due to Earth's curvature
   */
  private kmToLngDegrees(km: number, latitude: number): number {
    const latRad = latitude * (Math.PI / 180)
    return km / (111.0 * Math.cos(latRad))
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * Returns distance in kilometers
   */
  private haversineDistance(coord1: ICoordinate, coord2: ICoordinate): number {
    const R = 6371 // Earth's radius in km
    const dLat = this.toRadians(coord2.latitude - coord1.latitude)
    const dLng = this.toRadians(coord2.longitude - coord1.longitude)

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }
}
