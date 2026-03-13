/**
 * RequestQueue
 * Queue đa luồng với rate limit - đảm bảo không vượt 300 requests/phút (GMapsExtractor API)
 * Sử dụng p-queue để giới hạn concurrent requests và throughput
 */

import PQueue from 'p-queue'
import { MAX_CONCURRENT, DELAY_MS } from './config/constants.js'

type TaskFn<T> = () => Promise<T>

export class RequestQueue {
  private readonly queue: PQueue

  constructor(options?: { concurrency?: number; intervalCap?: number; interval?: number }) {
    const concurrency = options?.concurrency ?? MAX_CONCURRENT
    // 300 req/phút ≈ 5 req/giây; interval 1s, intervalCap 5
    const interval = options?.interval ?? 1000
    const intervalCap = options?.intervalCap ?? MAX_CONCURRENT

    this.queue = new PQueue({
      concurrency,
      interval,
      intervalCap,
      carryoverConcurrencyCount: true,
    })
  }

  /**
   * Thêm task vào queue
   * @param fn - Hàm async trả về Promise
   * @returns Promise resolve với kết quả của fn
   */
  public addTask<T>(fn: TaskFn<T>): Promise<T> {
    return this.queue.add(fn) as Promise<T>
  }

  /**
   * Promise resolve khi queue rỗng (tất cả task đã hoàn thành)
   */
  public onIdle(): Promise<void> {
    return this.queue.onIdle()
  }

  /**
   * Số task đang chờ
   */
  public get pending(): number {
    return this.queue.pending
  }

  /**
   * Số task trong queue
   */
  public get size(): number {
    return this.queue.size
  }
}
