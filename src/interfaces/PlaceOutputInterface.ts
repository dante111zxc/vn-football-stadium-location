/**
 * Output format cho mỗi địa điểm sau khi map từ GMapsExtractor API
 */
export interface IPlaceOutput {
  Name: string
  Description: string
  Fulladdress: string
  Street: string
  Municipality: string
  Categories: string[]
  Time: string
  Zone: string
  Amenities: string[]
  Phone: string
  Phones: string
  Claimed: string
  'Review Count': number
  'Average Rating': number
  'Review URL': string
  'Google Maps URL': string
  Latitude: number
  Longitude: number
  Website: string
  Domain: string
  'Opening Hours': string
  'Featured Image': string
  Cid: string
  Fid: string
  'Place Id': string
}
