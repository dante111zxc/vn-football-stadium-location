/**
 * StadiumScraper
 * Gọi API từng ô lưới tuần tự → mỗi lần API trả về → updateOrCreate vào file JSON ngay
 * Hỗ trợ resume từ cell đã dừng trước đó
 */

import * as fs from 'fs'
import { GridGenerator } from './GridGenerator.js'
import { GMapsExtractorClient } from './GMapsExtractorClient.js'
import { StadiumStorage } from './StadiumStorage.js'
import { Storage } from './Storage.js'
import {
  DEFAULT_STORAGE_PATH,
  SEARCH_QUERIES,
  OUTPUT_STADIUMS_PATH,
  PROVINCE_BOUNDS,
} from './config/constants.js'
import type { IPlaceOutput } from './interfaces/PlaceOutputInterface.ts'

const PROGRESS_FILE = 'output/progress.json'

interface IProgress {
  lastCompletedCell: number
  totalCells: number
  updatedAt: string
}

export interface StadiumScraperOptions {
  gridGenerator?: GridGenerator
  gmapsClient?: GMapsExtractorClient
  storage?: StadiumStorage
}

export class StadiumScraper {
  private readonly gridGenerator: GridGenerator
  private readonly gmapsClient: GMapsExtractorClient
  private readonly storage: StadiumStorage
  private readonly defaultStorage: Storage

  constructor(options: StadiumScraperOptions = {}) {
    this.gridGenerator = options.gridGenerator ?? new GridGenerator()
    this.gmapsClient = options.gmapsClient ?? new GMapsExtractorClient()
    this.storage = options.storage ?? new StadiumStorage()
    this.defaultStorage = new Storage()
  }

  private loadProgress(): IProgress | null {
    try {
      if (fs.existsSync(PROGRESS_FILE)) {
        const data = fs.readFileSync(PROGRESS_FILE, 'utf-8')
        return JSON.parse(data) as IProgress
      }
    } catch {
      console.warn('[Warning] Không thể đọc file progress, bắt đầu từ đầu')
    }
    return null
  }

  private saveProgress(cellIndex: number, totalCells: number): void {
    const progress: IProgress = {
      lastCompletedCell: cellIndex,
      totalCells,
      updatedAt: new Date().toISOString(),
    }
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2))
  }

  private clearProgress(): void {
    if (fs.existsSync(PROGRESS_FILE)) {
      fs.unlinkSync(PROGRESS_FILE)
    }
  }

  /**
   * Chạy quét toàn bộ sân bóng Việt Nam (gói API không giới hạn)
   * Hỗ trợ resume từ cell đã dừng trước đó
   */
  public async run(): Promise<IPlaceOutput[]> {
    const gridCells = this.gridGenerator.generateVietnamGrid()
    const totalCells = gridCells.length

    const savedProgress = this.loadProgress()
    let startFromCell = 0

    if (savedProgress && savedProgress.totalCells === totalCells) {
      startFromCell = savedProgress.lastCompletedCell + 1
      if (startFromCell >= totalCells) {
        console.log(`\n=== Đã hoàn thành tất cả ${totalCells} cells trước đó ===`)
        console.log(`Xóa file progress và chạy lại từ đầu nếu muốn crawl lại.`)
        return this.storage.load(OUTPUT_STADIUMS_PATH)
      }
      console.log(`\n=== Resume crawl từ cell ${startFromCell + 1}/${totalCells} ===`)
      console.log(`Tiến trình trước: ${savedProgress.lastCompletedCell + 1} cells hoàn thành`)
      console.log(`Còn lại: ${totalCells - startFromCell} cells\n`)
    } else {
      if (savedProgress) {
        console.log(`[Warning] Cấu hình grid đã thay đổi (${savedProgress.totalCells} -> ${totalCells} cells), bắt đầu từ đầu`)
      }
      console.log(`\n=== Bắt đầu crawl toàn bộ Việt Nam ===`)
      console.log(`Tổng số ô lưới: ${totalCells}`)
      console.log(`Số query: ${SEARCH_QUERIES.length} (${SEARCH_QUERIES.join(', ')})\n`)
    }

    const startTime = Date.now()
    let lastCompletedCell = startFromCell > 0 ? startFromCell - 1 : -1

    const handleExit = () => {
      console.log(`\n[Interrupted] Đang lưu tiến trình...`)
      if (lastCompletedCell >= 0) {
        this.saveProgress(lastCompletedCell, totalCells)
        console.log(`Đã lưu tiến trình: cell ${lastCompletedCell + 1}/${totalCells}`)
        console.log(`Chạy lại để tiếp tục từ cell ${lastCompletedCell + 2}`)
      }
      process.exit(0)
    }

    process.on('SIGINT', handleExit)
    process.on('SIGTERM', handleExit)

    try {
      for (let i = startFromCell; i < totalCells; i++) {
        const cell = gridCells[i]
        if (!cell) continue

        const lat = cell.center.latitude
        const lng = cell.center.longitude

        const progress = (((i + 1) / totalCells) * 100).toFixed(1)
        const density = cell.densityLevel ?? 'unknown'
        console.log(
          `[${progress}%] Cell ${i + 1}/${totalCells} | ${cell.id} (${density}) | ${lat.toFixed(4)}, ${lng.toFixed(4)}`
        )

        for (const query of SEARCH_QUERIES) {
          try {
            await this.gmapsClient.searchAllPages(query, lat, lng, {
              onPageReceived: (places) =>
                this.storage.updateOrCreate(places, OUTPUT_STADIUMS_PATH),
            })
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            if (msg.includes('GMapsExtractor API error - stopping')) {
              this.saveProgress(lastCompletedCell, totalCells)
              throw err
            }
            console.error(`[Error] Cell ${cell.id} query="${query}":`, err)
          }
        }

        lastCompletedCell = i
        this.saveProgress(i, totalCells)
      }

      const elapsedMs = Date.now() - startTime
      const elapsedMin = (elapsedMs / 60000).toFixed(1)

      this.clearProgress()

      const result = this.storage.load(OUTPUT_STADIUMS_PATH)
      console.log(`\n=== Hoàn thành ===`)
      console.log(`Thời gian: ${elapsedMin} phút`)
      console.log(`Tổng sân bóng tìm thấy: ${result.length}`)
      console.log(`Đã lưu vào: ${OUTPUT_STADIUMS_PATH}`)

      return result
    } finally {
      process.removeListener('SIGINT', handleExit)
      process.removeListener('SIGTERM', handleExit)
    }
  }

  /**
   * Chạy quét sân bóng cho các tỉnh/thành phố chỉ định
   */
  public async runForProvinces(
    provinceNames: string[]
  ): Promise<IPlaceOutput[]> {
    const gridCells: ReturnType<GridGenerator['generateProvinceGrid']> = []

    for (const name of provinceNames) {
      const bounds = PROVINCE_BOUNDS[name]

      if (!bounds) {
        console.warn(
          `[Warning] Không tìm thấy ranh giới tỉnh thành ${name} , bỏ qua.`
        )
        continue
      }

      const cells = this.gridGenerator.generateProvinceGrid(name, bounds)
      gridCells.push(...cells)
    }

    if (gridCells.length === 0) {
      console.error(
        '[Error] No valid provinces. Check PROVINCE_BOUNDS in constants.'
      )
      return []
    }

    this.defaultStorage.save(gridCells, DEFAULT_STORAGE_PATH)
    console.log(`Đã lưu ${gridCells.length} ô lưới vào ${DEFAULT_STORAGE_PATH}`)
    console.log('Starting stadium scrape for:', provinceNames.join(', '), '\n')

    for (const cell of gridCells) {
      const lat = cell.center.latitude
      const lng = cell.center.longitude

      for (const query of SEARCH_QUERIES) {
        try {
          await this.gmapsClient.searchAllPages(query, lat, lng, {
            onPageReceived: (places) =>
              this.storage.updateOrCreate(places, OUTPUT_STADIUMS_PATH),
          })
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          if (msg.includes('GMapsExtractor API error - stopping')) {
            throw err
          }
          console.error(`[Error] Cell ${cell.id} query="${query}":`, err)
        }
      }
    }
    console.log(
      'Đã hoàn thành quét sân bóng cho:',
      provinceNames.join(', '),
      '\n'
    )

    const result = this.storage.load(OUTPUT_STADIUMS_PATH)
    console.log(`\n=== Done ===`)
    console.log(`Found ${result.length} stadiums`)
    console.log(`Saved to ${OUTPUT_STADIUMS_PATH}`)
    console.log(`Đã hết dữ liệu`)

    return result
  }
}
