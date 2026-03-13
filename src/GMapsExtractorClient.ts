/**
 * GMapsExtractorClient
 * Gọi GMapsExtractor API v2 Search để tìm kiếm địa điểm (sân bóng) theo tọa độ
 * Endpoint: POST https://cloud.gmapsextractor.com/api/v2/search
 *
 * Response: { total, params, data } - total = số bản ghi/trang, page 1-10
 */

import axios, { type AxiosInstance } from 'axios'
import {
  ZOOM_LEVEL,
  GMAPSEXTRACTOR_API_BASE_URL,
  GMAPSEXTRACTOR_RESULTS_PER_PAGE,
  DELAY_BETWEEN_PAGES_MS,
  MAX_PAGES_PER_SEARCH,
} from './config/constants.js'
import type { IPlaceOutput } from './interfaces/PlaceOutputInterface.ts'
import type { IGMapsExtractorPlace } from './interfaces/GMapsExtractorPlaceInterface.ts'
import type { IGMapsExtractorResponse } from './interfaces/GMapsExtractorResponseInterface.ts'

export class GMapsExtractorClient {
  private readonly token: string
  private readonly http: AxiosInstance
  private readonly zoomLevel: number

  constructor(token?: string) {
    this.token = token ?? process.env['GMAPSEXTRACTOR_TOKEN'] ?? ''
    this.zoomLevel = ZOOM_LEVEL

    if (!this.token) {
      throw new Error(
        'GMAPSEXTRACTOR_TOKEN is required. Set it in .env or pass to constructor.'
      )
    }

    this.http = axios.create({
      baseURL: GMAPSEXTRACTOR_API_BASE_URL,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30_000,
    })
  }

  /**
   * Gọi API search 1 trang
   * @param query - Từ khóa tìm kiếm
   * @param lat - Vĩ độ tâm
   * @param lng - Kinh độ tâm
   * @param page - Trang (API hỗ trợ 1-20, page vượt có thể trả về [])
   */
  public async searchPlaces(
    query: string,
    lat: number,
    lng: number,
    page = 1
  ): Promise<IPlaceOutput[]> {
    const response = await this.http.post<IGMapsExtractorResponse>('/search', {
      q: query,
      page,
      ll: `@${lat},${lng},${this.zoomLevel}z`,
      hl: 'vi',
      gl: 'vn',
      extra: true,
    })

    if (response.status !== 200) {
      throw new Error(response.statusText)
    }

    const places = this.extractPlacesFromResponse(response.data)
    return places.map((p) => this.mapPlaceToOutput(p))
  }

  /**
   * Gọi tất cả các trang (1-10), merge kết quả
   * Dừng sớm nếu page trả về < 20 kết quả (hết dữ liệu)
   */
  public async searchAllPages(
    query: string,
    lat: number,
    lng: number
  ): Promise<IPlaceOutput[]> {
    const allPlaces: IPlaceOutput[] = []
    const seenPlaceIds = new Set<string>()

    for (let page = 1; page <= MAX_PAGES_PER_SEARCH; page++) {
      const places = await this.searchPlaces(query, lat, lng, page)

      if (places.length === 0) {
        if (page === 1) console.log('Đã hết dữ liệu')
        break
      }

      for (const p of places) {
        const placeId = p['Place Id']
        if (placeId && !seenPlaceIds.has(placeId)) {
          seenPlaceIds.add(placeId)
          allPlaces.push(p)
        } else if (!placeId) {
          allPlaces.push(p)
        }
      }

      if (places.length < GMAPSEXTRACTOR_RESULTS_PER_PAGE) break

      if (page < MAX_PAGES_PER_SEARCH) {
        await this.delay(DELAY_BETWEEN_PAGES_MS)
      }
    }

    return allPlaces
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private extractPlacesFromResponse(
    data: IGMapsExtractorResponse
  ): IGMapsExtractorPlace[] {
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.results)) return data.results
    if (Array.isArray(data?.places)) return data.places
    return []
  }

  private mapPlaceToOutput(place: IGMapsExtractorPlace): IPlaceOutput {
    const getName = (key: string) =>
      (place[key] ?? place['Name'] ?? place['name'] ?? '') as string
    const getStr = (key: string) => (place[key] ?? '') as string
    const getNum = (key: string) => {
      const v = place[key]
      return typeof v === 'number' ? v : 0
    }
    const getArr = (key: string): string[] => {
      const v = place[key]
      return Array.isArray(v) ? (v as string[]) : []
    }
    const lat = getNum('Latitude') || getNum('latitude') || getNum('lat')
    const lng = getNum('Longitude') || getNum('longitude') || getNum('lng')

    return {
      Name: getName('Name'),
      Description: getStr('About') || getStr('Description'),
      Fulladdress: getStr('Fulladdress'),
      Street: getStr('Street'),
      Municipality: getStr('Municipality'),
      Categories: getArr('Categories'),
      Time: getStr('Time') || '',
      Zone: getStr('Time Zone') || getStr('Zone'),
      Amenities: getArr('Amenities'),
      Phone: getStr('Phone'),
      Phones: getStr('Phones'),
      Claimed: getStr('Claimed'),
      'Review Count': getNum('Review Count'),
      'Average Rating': getNum('Average Rating'),
      'Review URL': getStr('Review URL'),
      'Google Maps URL': getStr('Google Maps URL'),
      Latitude: lat,
      Longitude: lng,
      Website: getStr('Website') || '',
      Domain: getStr('Domain') || '',
      'Opening Hours': getStr('Opening Hours'),
      'Featured Image': getStr('Featured Image'),
      Cid: getStr('Cid'),
      Fid: getStr('Fid'),
      'Place Id': getStr('Place Id') || getStr('place_id') || getStr('gmap_id'),
    }
  }
}
