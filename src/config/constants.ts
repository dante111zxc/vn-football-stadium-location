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
export const SEARCH_QUERIES = ['sân bóng', 'sân cỏ nhân tạo']

/** Đường dẫn file JSON output */
export const OUTPUT_STADIUMS_PATH = 'output/stadiums.json'
export const DEFAULT_STORAGE_PATH = 'output/default.json'

export const ZOOM_LEVEL = 11
/** Delay giữa mỗi page (ms) - tránh rate limit */
export const DELAY_BETWEEN_PAGES_MS = 300

/** GMapsExtractor API */
export const GMAPSEXTRACTOR_API_BASE_URL =
  'https://cloud.gmapsextractor.com/api/v2'
export const GMAPSEXTRACTOR_MAX_PAGES = 5
export const GMAPSEXTRACTOR_RESULTS_PER_PAGE = 20

/** Gói API không giới hạn - không cần giới hạn số ô lưới */
export const UNLIMITED_API = true
/** Số page tối đa mỗi search - giảm xuống 5 vì hầu hết kết quả nằm ở trang đầu */
export const MAX_PAGES_PER_SEARCH = 5

/**
 * Ranh giới tỉnh/thành phố để crawl theo vùng
 * Derive từ URBAN_CENTERS (center ± radius)
 */
export const PROVINCE_BOUNDS: Record<string, IBoundingBox> = {
  'An Giang': { north: 10.95, south: 10.18, east: 105.58, west: 104.77 },
  'Bà Rịa - Vũng Tàu': { north: 10.73, south: 8.6, east: 107.58, west: 106.37 }, // Bao gồm Côn Đảo
  'Bạc Liêu': { north: 9.61, south: 9.07, east: 105.82, west: 105.23 },
  'Bắc Giang': { north: 21.62, south: 21.11, east: 107.03, west: 105.88 },
  'Bắc Kạn': { north: 22.74, south: 21.8, east: 106.25, west: 105.44 },
  'Bắc Ninh': { north: 21.27, south: 20.97, east: 106.31, west: 105.9 },
  'Bến Tre': { north: 10.33, south: 9.8, east: 106.79, west: 105.95 },
  'Bình Dương': { north: 11.5, south: 10.83, east: 106.91, west: 106.34 },
  'Bình Định': { north: 14.7, south: 13.51, east: 109.35, west: 108.55 },
  'Bình Phước': { north: 12.18, south: 11.33, east: 107.47, west: 106.39 },
  'Bình Thuận': { north: 11.58, south: 10.55, east: 109, west: 107.39 },
  'Cà Mau': { north: 9.56, south: 8.56, east: 105.41, west: 104.72 },
  'Cao Bằng': { north: 23.06, south: 22.28, east: 106.9, west: 105.78 },
  'Cần Thơ': { north: 10.32, south: 9.92, east: 105.85, west: 105.22 },
  'Đà Nẵng': { north: 16.33, south: 15.91, east: 108.45, west: 107.82 },
  'Đắk Lắk': { north: 13.42, south: 12.18, east: 108.99, west: 107.18 },
  'Đắk Nông': { north: 12.5, south: 11.75, east: 108.15, west: 107.2 },
  'Điện Biên': { north: 22.55, south: 20.9, east: 103.5, west: 102.15 },
  'Đồng Nai': { north: 11.58, south: 10.75, east: 107.58, west: 106.75 },
  'Đồng Tháp': { north: 10.93, south: 10.12, east: 105.97, west: 105.18 },
  'Gia Lai': { north: 14.6, south: 12.97, east: 108.85, west: 107.45 },
  'Hà Giang': { north: 23.39, south: 22.14, east: 105.5, west: 104.38 },
  'Hà Nam': { north: 20.67, south: 20.37, east: 106.1, west: 105.78 },
  'Hà Nội': { north: 21.38, south: 20.58, east: 106.03, west: 105.28 },
  'Hà Tĩnh': { north: 18.63, south: 17.88, east: 106.49, west: 105.11 },
  'Hải Dương': { north: 21.23, south: 20.72, east: 106.63, west: 106.05 },
  'Hải Phòng': { north: 21.02, south: 20.5, east: 107.12, west: 106.38 },
  'Hậu Giang': { north: 10, south: 9.5, east: 106, west: 105.3 },
  'Hòa Bình': { north: 21.13, south: 20.28, east: 105.8, west: 104.8 },
  'Hưng Yên': { north: 21.02, south: 20.5, east: 106.18, west: 105.88 },
  'Khánh Hòa': { north: 12.87, south: 11.7, east: 109.45, west: 108.68 },
  'Kiên Giang': { north: 10.53, south: 9.2, east: 105.43, west: 102.8 }, // Bao gồm Phú Quốc
  'Kon Tum': { north: 15.25, south: 14.15, east: 108.63, west: 107.33 },
  'Lai Châu': { north: 22.82, south: 21.75, east: 103.88, west: 102.3 },
  'Lạng Sơn': { north: 22.32, south: 21.32, east: 107.23, west: 106.1 },
  'Lào Cai': { north: 22.85, south: 21.87, east: 104.63, west: 103.52 },
  'Lâm Đồng': { north: 12.32, south: 11.13, east: 108.77, west: 107.25 },
  'Long An': { north: 11.03, south: 10.38, east: 106.78, west: 105.5 },
  'Nam Định': { north: 20.48, south: 19.9, east: 106.6, west: 105.95 },
  'Nghệ An': { north: 19.41, south: 18.55, east: 105.78, west: 103.88 },
  'Ninh Bình': { north: 20.45, south: 19.9, east: 106.17, west: 105.53 },
  'Ninh Thuận': { north: 11.9, south: 11.3, east: 109.23, west: 108.53 },
  'Phú Thọ': { north: 21.72, south: 20.93, east: 105.45, west: 104.8 },
  'Phú Yên': { north: 13.68, south: 12.7, east: 109.43, west: 108.65 },
  'Quảng Bình': { north: 18.08, south: 17.08, east: 106.98, west: 105.62 },
  'Quảng Nam': { north: 16.07, south: 14.95, east: 108.73, west: 107.21 },
  'Quảng Ngãi': { north: 15.3, south: 14.53, east: 109.1, west: 108.1 },
  'Quảng Ninh': { north: 21.72, south: 20.67, east: 108.05, west: 106.43 },
  'Quảng Trị': { north: 17.17, south: 16.32, east: 107.38, west: 106.5 },
  'Sóc Trăng': { north: 10.03, south: 9.2, east: 106.3, west: 105.55 },
  'Sơn La': { north: 21.85, south: 20.65, east: 105.2, west: 103.18 },
  'Tây Ninh': { north: 11.78, south: 11.02, east: 106.45, west: 105.82 },
  'Thái Bình': { north: 20.62, south: 20.2, east: 106.62, west: 106.05 },
  'Thái Nguyên': { north: 22.05, south: 21.32, east: 106.25, west: 105.48 },
  'Thanh Hóa': { north: 20.67, south: 19.3, east: 106.08, west: 104.37 },
  'Thừa Thiên Huế': { north: 16.75, south: 15.98, east: 108.27, west: 107.03 },
  'Tiền Giang': { north: 10.6, south: 10.18, east: 106.8, west: 105.82 },
  'TP Hồ Chí Minh': { north: 11.17, south: 10.35, east: 107.02, west: 106.37 },
  'Trà Vinh': { north: 10.08, south: 9.52, east: 106.67, west: 105.95 },
  'Tuyên Quang': { north: 22.68, south: 21.5, east: 105.67, west: 104.88 },
  'Vĩnh Long': { north: 10.33, south: 9.87, east: 106.18, west: 105.78 },
  'Vĩnh Phúc': { north: 21.53, south: 21.1, east: 105.78, west: 105.33 },
  'Yên Bái': { north: 22.28, south: 21.33, east: 105.08, west: 104.03 },
}
