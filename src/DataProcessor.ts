/**
 * DataProcessor
 * Xử lý dữ liệu: dedupe theo Place Id, format output
 */

import type { IPlaceOutput } from './interfaces/PlaceOutputInterface.ts'

export class DataProcessor {
  /**
   * Loại bỏ trùng lặp theo Place Id (ưu tiên bản đầu tiên)
   */
  public deduplicateByPlaceId(places: IPlaceOutput[]): IPlaceOutput[] {
    const map = new Map<string, IPlaceOutput>()
    for (const p of places) {
      const key = p['Place Id'] || `${p.Name}-${p.Fulladdress}-${p.Latitude}-${p.Longitude}`
      if (!map.has(key)) {
        map.set(key, p)
      }
    }
    return Array.from(map.values())
  }

  /**
   * Chuẩn hóa output - đảm bảo đủ field theo IPlaceOutput
   */
  public formatOutput(places: IPlaceOutput[]): IPlaceOutput[] {
    return places.map((p) => ({ ...p }))
  }
}
