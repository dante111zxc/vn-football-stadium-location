/**
 * Storage
 * Class chung đảm nhiệm lưu, cập nhật, xóa file JSON
 * Không phụ thuộc vào kiểu dữ liệu cụ thể
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs'
import { dirname } from 'node:path'
import type { IStorage } from './interfaces/IStorage.ts'

export class Storage implements IStorage {
  /**
   * Lưu dữ liệu ra file JSON (ghi đè nếu đã tồn tại)
   */
  public save(data: unknown, path: string): void {
    const dir = dirname(path)
    mkdirSync(dir, { recursive: true })
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8')
  }

  /**
   * Đọc dữ liệu từ file JSON
   * @returns Parsed data hoặc [] nếu file không tồn tại
   */
  public load<T>(path: string): T {
    if (!existsSync(path)) {
      return [] as T
    }
    const content = readFileSync(path, 'utf-8')
    return JSON.parse(content) as T
  }

  /**
   * Cập nhật file (ghi đè toàn bộ nội dung)
   */
  public update(path: string, data: unknown): void {
    this.save(data, path)
  }

  /**
   * Xóa file
   * @returns true nếu xóa thành công, false nếu file không tồn tại
   */
  public delete(path: string): boolean {
    if (!existsSync(path)) return false
    unlinkSync(path)
    return true
  }

  /**
   * Kiểm tra file đã tồn tại chưa
   */
  public exists(path: string): boolean {
    return existsSync(path)
  }
}
