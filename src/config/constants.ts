import type { IBoundingBox } from '../interfaces/BoundingBoxInterface.ts'
import type { IUrbanCenter } from '../interfaces/UrbanCenterInterface.ts'

/**
 * Vietnam geographical bounds
 * Northernmost: Lũng Cú, Hà Giang | Southernmost: Mũi Cà Mau | Easternmost: Quần đảo Trường Sa | Westernmost: Điện Biên
 */
export const VIETNAM_BOUNDS: IBoundingBox = {
  north: 23.393395,
  south: 8.559611,
  east: 109.464638,
  west: 102.144441,
}

/**
 * Major cities coordinates for adaptive grid sizing
 */
export const URBAN_CENTERS: IUrbanCenter[] = [
  {
    name: 'Hà Nội',
    coordinate: { latitude: 21.0285, longitude: 105.8542 },
    radius: 30,
  },
  {
    name: 'TP.HCM',
    coordinate: { latitude: 10.8231, longitude: 106.6297 },
    radius: 40,
  },
  {
    name: 'Đà Nẵng',
    coordinate: { latitude: 16.0544, longitude: 108.2022 },
    radius: 20,
  },
  {
    name: 'Hải Phòng',
    coordinate: { latitude: 20.8449, longitude: 106.6881 },
    radius: 15,
  },
  {
    name: 'Cần Thơ',
    coordinate: { latitude: 10.0452, longitude: 105.7469 },
    radius: 15,
  },
  {
    name: 'Biên Hòa',
    coordinate: { latitude: 10.951, longitude: 106.8439 },
    radius: 12,
  },
  {
    name: 'Huế',
    coordinate: { latitude: 16.4637, longitude: 107.5909 },
    radius: 10,
  },
  {
    name: 'Nha Trang',
    coordinate: { latitude: 12.2388, longitude: 109.1967 },
    radius: 10,
  },
  {
    name: 'Buôn Ma Thuột',
    coordinate: { latitude: 12.6675, longitude: 108.0378 },
    radius: 8,
  },
  {
    name: 'Vinh',
    coordinate: { latitude: 18.6792, longitude: 105.6811 },
    radius: 8,
  },
]

export const GRID_STEP_KM = 15
export const SEARCH_QUERIES = [
  // 'sân bóng đá',
  'sân bóng',
  // 'sân cỏ nhân tạo',
]

/** Đường dẫn file JSON output */
export const OUTPUT_STADIUMS_PATH = 'output/stadiums.json'

export const ZOOM_LEVEL = 11
/** Số request đồng thời - giảm xuống 1 để tránh "too many requests" (429) */
export const MAX_CONCURRENT = 1
export const DELAY_MS = 250
/** Delay giữa mỗi page khi gọi searchAllPages (ms) - tránh 429 */
export const DELAY_BETWEEN_PAGES_MS = 500

/** GMapsExtractor API */
export const GMAPSEXTRACTOR_API_BASE_URL =
  'https://cloud.gmapsextractor.com/api/v2'
export const GMAPSEXTRACTOR_MAX_PAGES = 10
export const GMAPSEXTRACTOR_RESULTS_PER_PAGE = 20

/**
 * Giới hạn Free tier: 1000 requests/ngày
 * 1 request = 1 lần gọi API (1 page)
 * Công thức: MAX_GRID_CELLS × SEARCH_QUERIES.length × MAX_PAGES_PER_SEARCH ≤ MAX_DAILY_REQUESTS
 */
export const MAX_DAILY_REQUESTS = 950
/** Chỉ lấy page 1 mỗi ô (20 kết quả) - tiết kiệm request. Dùng 10 nếu có gói trả phí */
export const MAX_PAGES_PER_SEARCH = 10
/** Số ô lưới tối đa = 950 / (5 query × 1 page) = 190 ô */
export const MAX_GRID_CELLS = Math.floor(
  MAX_DAILY_REQUESTS / (SEARCH_QUERIES.length * MAX_PAGES_PER_SEARCH)
)

/**
 * Ranh giới tỉnh/thành phố để crawl theo vùng
 * Derive từ URBAN_CENTERS (center ± radius)
 */
export const PROVINCE_BOUNDS: Record<string, IBoundingBox> = {
  'Hà Nội': {
    north: 21.3,
    south: 20.76,
    east: 106.14,
    west: 105.56,
  },
}
