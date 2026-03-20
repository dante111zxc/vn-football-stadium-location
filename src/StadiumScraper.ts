/**
 * StadiumScraper
 * Gọi API từng ô lưới tuần tự → mỗi lần API trả về → updateOrCreate vào file JSON ngay
 */

import { GridGenerator } from './GridGenerator.js'
import { GMapsExtractorClient } from './GMapsExtractorClient.js'
import { StadiumStorage } from './StadiumStorage.js'
import { Storage } from './Storage.js'
import {
  DEFAULT_STORAGE_PATH,
  SEARCH_QUERIES,
  OUTPUT_STADIUMS_PATH,
  MAX_GRID_CELLS,
  PROVINCE_BOUNDS,
} from './config/constants.js'
import type { IPlaceOutput } from './interfaces/PlaceOutputInterface.ts'

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

  /**
   * Chạy quét toàn bộ sân bóng Việt Nam
   */
  public async run(): Promise<IPlaceOutput[]> {
    const allCells = this.gridGenerator.generateVietnamGrid()
    const gridCells = allCells.slice(0, MAX_GRID_CELLS)
    if (gridCells.length < allCells.length) {
      console.log(
        `[Free tier] Limiting to ${MAX_GRID_CELLS} cells (of ${allCells.length})`
      )
    }

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

    const result = this.storage.load(OUTPUT_STADIUMS_PATH)
    console.log(`\n=== Done ===`)
    console.log(`Found ${result.length} stadiums`)
    console.log(`Saved to ${OUTPUT_STADIUMS_PATH}`)
    console.log(`Đã hết dữ liệu`)

    return result
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
