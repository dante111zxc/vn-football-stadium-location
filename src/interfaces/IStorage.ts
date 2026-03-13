/**
 * Interface cho lớp lưu trữ file (JSON)
 * Cho phép inject implementation, dễ test và thay thế
 */
export interface IStorage {
  save(data: unknown, path: string): void
  load<T>(path: string): T
  update(path: string, data: unknown): void
  delete(path: string): boolean
  exists(path: string): boolean
}
