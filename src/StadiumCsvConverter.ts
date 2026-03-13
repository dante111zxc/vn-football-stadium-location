/**
 * StadiumCsvConverter
 * Chuyển đổi stadiums.json sang định dạng CSV
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { OUTPUT_STADIUMS_PATH } from './config/constants.js'
import type { IPlaceOutput } from './interfaces/PlaceOutputInterface.ts'

const CSV_HEADERS: (keyof IPlaceOutput)[] = [
  'Name',
  'Description',
  'Fulladdress',
  'Street',
  'Municipality',
  'Categories',
  'Amenities',
  'Time',
  'Zone',
  'Phone',
  'Phones',
  'Claimed',
  'Review Count',
  'Average Rating',
  'Review URL',
  'Google Maps URL',
  'Latitude',
  'Longitude',
  'Website',
  'Domain',
  'Opening Hours',
  'Featured Image',
  'Cid',
  'Fid',
  'Place Id',
]

const ARRAY_HEADERS: (keyof IPlaceOutput)[] = ['Categories', 'Amenities']

export class StadiumCsvConverter {
  /**
   * Escape giá trị cho CSV (wrap trong quotes nếu chứa comma, newline, quote)
   */
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('\n') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  /**
   * Chuyển 1 place thành giá trị cell (array → join bằng ;)
   */
  private getCellValue(place: IPlaceOutput, key: keyof IPlaceOutput): string {
    const val = place[key]
    if (val === undefined || val === null) return ''
    if (ARRAY_HEADERS.includes(key)) {
      const arr = Array.isArray(val) ? val : [val]
      return arr.join('; ')
    }
    return String(val)
  }

  /**
   * Tạo 1 dòng CSV từ place
   */
  private placeToRow(place: IPlaceOutput): string {
    return CSV_HEADERS.map((key) => {
      const cell = this.getCellValue(place, key)
      return this.escapeCsvValue(cell)
    }).join(',')
  }

  /**
   * Convert JSON sang CSV
   * @param jsonPath - Đường dẫn file JSON (mặc định: output/stadiums.json)
   * @param csvPath - Đường dẫn file CSV output (mặc định: output/stadiums.csv)
   */
  public convert(jsonPath = OUTPUT_STADIUMS_PATH, csvPath?: string): string {
    const outPath = csvPath ?? jsonPath.replace(/\.json$/i, '.csv')

    const content = readFileSync(jsonPath, 'utf-8')
    const data = JSON.parse(content) as IPlaceOutput[]

    if (!Array.isArray(data)) {
      throw new Error('JSON phải là mảng IPlaceOutput[]')
    }

    const headerRow = CSV_HEADERS.join(',')
    const dataRows = data.map((p) => this.placeToRow(p))
    const csv = [headerRow, ...dataRows].join('\n')

    // UTF-8 BOM để Excel mở đúng tiếng Việt
    const bom = '\uFEFF'
    writeFileSync(outPath, bom + csv, 'utf-8')

    console.log(`Đã convert ${data.length} sân bóng → ${outPath}`)
    return outPath
  }
}
