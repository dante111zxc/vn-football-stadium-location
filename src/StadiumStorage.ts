/**
 * StadiumStorage
 * Class chuyên lưu trữ/đọc dữ liệu sân bóng - sử dụng Storage (file I/O)
 * Không phụ thuộc cứng vào fs hay path - inject Storage và defaultPath
 */

import { OUTPUT_STADIUMS_PATH } from './config/constants.js'
import type { IPlaceOutput } from './interfaces/PlaceOutputInterface.ts'
import type { IStorage } from './interfaces/IStorage.ts'
import { Storage } from './Storage.js'

export class StadiumStorage {
  private readonly storage: IStorage
  private readonly defaultPath: string

  constructor(options?: { storage?: IStorage; defaultPath?: string }) {
    this.storage = options?.storage ?? new Storage()
    this.defaultPath = options?.defaultPath ?? OUTPUT_STADIUMS_PATH
  }

  /**
   * Lưu danh sách places ra file JSON
   */
  public save(places: IPlaceOutput[], filePath?: string): void {
    this.storage.save(places, filePath ?? this.defaultPath)
  }

  /**
   * Đọc danh sách places từ file JSON
   */
  public load(filePath?: string): IPlaceOutput[] {
    const data = this.storage.load(filePath ?? this.defaultPath)
    return Array.isArray(data) ? (data as IPlaceOutput[]) : []
  }

  /**
   * Cập nhật file - merge places mới vào dữ liệu hiện có (dedupe theo Place Id)
   * Log: thêm mới / cập nhật trùng
   */
  public update(places: IPlaceOutput[], filePath?: string): void {
    const path = filePath ?? this.defaultPath
    const existing = this.load(path)
    const map = new Map<string, IPlaceOutput>()
    const getKey = (p: IPlaceOutput) =>
      p['Place Id'] || `${p.Name}-${p.Fulladdress}-${p.Latitude}-${p.Longitude}`
    for (const p of existing) {
      map.set(getKey(p), p)
    }
    for (const p of places) {
      const key = getKey(p)
      const name = p.Name || '(không tên)'
      const wasExisting = map.has(key)
      map.set(key, p)
      if (wasExisting) {
        console.log(`sân ${name} đã tồn tại -> cập nhật dữ liệu`)
      } else {
        console.log(`Đã thêm ${name} vào Data`)
      }
    }
    this.save(Array.from(map.values()), path)
  }

  /**
   * Kiểm tra file đã tồn tại chưa
   */
  public exists(filePath?: string): boolean {
    return this.storage.exists(filePath ?? this.defaultPath)
  }

  /**
   * Xóa file
   */
  public delete(filePath?: string): boolean {
    return this.storage.delete(filePath ?? this.defaultPath)
  }
}
