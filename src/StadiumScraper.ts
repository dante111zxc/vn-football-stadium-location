/**
 * StadiumScraper
 * Class chính điều phối: tạo lưới → gọi API qua queue → dedupe → lưu JSON
 */

import { GridGenerator } from './GridGenerator.js'
import { GMapsExtractorClient } from './GMapsExtractorClient.js'
import { RequestQueue } from './RequestQueue.js'
import { DataProcessor } from './DataProcessor.js'
import { StadiumStorage } from './StadiumStorage.js'
import {
  SEARCH_QUERIES,
  OUTPUT_STADIUMS_PATH,
  MAX_GRID_CELLS,
  PROVINCE_BOUNDS,
} from './config/constants.js'
import type { IPlaceOutput } from './interfaces/PlaceOutputInterface.ts'

export interface StadiumScraperOptions {
  gridGenerator?: GridGenerator
  gmapsClient?: GMapsExtractorClient
  requestQueue?: RequestQueue
  dataProcessor?: DataProcessor
  storage?: StadiumStorage
}

export class StadiumScraper {
  private readonly gridGenerator: GridGenerator
  private readonly gmapsClient: GMapsExtractorClient
  private readonly requestQueue: RequestQueue
  private readonly dataProcessor: DataProcessor
  private readonly storage: StadiumStorage

  constructor(options: StadiumScraperOptions = {}) {
    this.gridGenerator = options.gridGenerator ?? new GridGenerator()
    this.gmapsClient = options.gmapsClient ?? new GMapsExtractorClient()
    this.requestQueue = options.requestQueue ?? new RequestQueue()
    this.dataProcessor = options.dataProcessor ?? new DataProcessor()
    this.storage = options.storage ?? new StadiumStorage()
  }

  /**
   * Chạy quét toàn bộ sân bóng Việt Nam
   */
  public async run(): Promise<IPlaceOutput[]> {
    const allCells = this.gridGenerator.generateVietnamGrid()
    const gridCells = allCells.slice(0, MAX_GRID_CELLS)
    if (gridCells.length < allCells.length) {
      console.log(
        `[Free tier] Limiting to ${MAX_GRID_CELLS} cells (of ${allCells.length}) to stay under 1000 requests/day`
      )
    }
    const totalTasks = gridCells.length * SEARCH_QUERIES.length
    const taskPromises: Promise<IPlaceOutput[]>[] = []

    for (const cell of gridCells) {
      const lat = cell.center.latitude
      const lng = cell.center.longitude

      for (const query of SEARCH_QUERIES) {
        const promise = this.requestQueue.addTask(async () => {
          try {
            return await this.gmapsClient.searchAllPages(query, lat, lng)
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            if (msg.includes('GMapsExtractor API error - stopping')) {
              throw err
            }
            console.error(`[Error] Cell ${cell.id} query="${query}":`, err)
            return []
          }
        })
        taskPromises.push(promise)
      }
    }

    const results = await Promise.all(taskPromises)
    const allStadiums = results.flat()

    console.log(
      `Processed ${totalTasks}/${totalTasks} grids | Collected ${allStadiums.length} stadiums (before dedupe)`
    )

    const uniqueStadiums = this.dataProcessor.deduplicateByPlaceId(allStadiums)
    const formatted = this.dataProcessor.formatOutput(uniqueStadiums)
    this.storage.update(formatted, OUTPUT_STADIUMS_PATH)

    console.log(`\n=== Done ===`)
    console.log(`Found ${formatted.length} unique stadiums`)
    console.log(`Saved to ${OUTPUT_STADIUMS_PATH}`)
    console.log(`Đã hết dữ liệu`)

    return formatted
  }

  /**
   * Chạy quét sân bóng cho các tỉnh/thành phố chỉ định
   * @param provinceNames - Danh sách tên tỉnh (phải có trong PROVINCE_BOUNDS)
   */
  public async runForProvinces(
    provinceNames: string[]
  ): Promise<IPlaceOutput[]> {
    const gridCells: ReturnType<GridGenerator['generateProvinceGrid']> = []
    for (const name of provinceNames) {
      const bounds = PROVINCE_BOUNDS[name]
      if (!bounds) {
        console.warn(`[Warning] No bounds for province "${name}", skipping.`)
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

    const totalTasks = gridCells.length * SEARCH_QUERIES.length
    const taskPromises: Promise<IPlaceOutput[]>[] = []

    for (const cell of gridCells) {
      const lat = cell.center.latitude
      const lng = cell.center.longitude

      for (const query of SEARCH_QUERIES) {
        const promise = this.requestQueue.addTask(async () => {
          try {
            return await this.gmapsClient.searchAllPages(query, lat, lng)
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err)
            if (msg.includes('GMapsExtractor API error - stopping')) {
              throw err
            }
            console.error(`[Error] Cell ${cell.id} query="${query}":`, err)
            return []
          }
        })
        taskPromises.push(promise)
      }
    }

    const results = await Promise.all(taskPromises)
    const allStadiums = results.flat()

    console.log(
      `Processed ${totalTasks} grids (${provinceNames.join(', ')}) | Collected ${allStadiums.length} stadiums (before dedupe)`
    )

    const uniqueStadiums = this.dataProcessor.deduplicateByPlaceId(allStadiums)
    const formatted = this.dataProcessor.formatOutput(uniqueStadiums)
    this.storage.update(formatted, OUTPUT_STADIUMS_PATH)

    console.log(`\n=== Done ===`)
    console.log(`Found ${formatted.length} unique stadiums`)
    console.log(`Saved to ${OUTPUT_STADIUMS_PATH}`)
    console.log(`Đã hết dữ liệu`)

    return formatted
  }
}
