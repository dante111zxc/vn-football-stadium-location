/**
 * Raw item từ GMapsExtractor API v2 - schema thực tế từ response
 * API trả về Pascal Case: Name, Fulladdress, Place Id, ...
 */
export interface IGMapsExtractorPlace {
  Name?: string
  Description?: string
  About?: string
  Fulladdress?: string
  Street?: string
  Municipality?: string
  Categories?: string[]
  Time?: string
  'Time Zone'?: string
  Amenities?: string[]
  Phone?: string
  Phones?: string
  Claimed?: string
  'Review Count'?: number
  'Average Rating'?: number
  'Review URL'?: string
  'Google Maps URL'?: string
  Latitude?: number
  Longitude?: number
  Website?: string
  Domain?: string
  'Opening Hours'?: string
  'Featured Image'?: string
  Cid?: string
  Fid?: string
  'Place Id'?: string
  /** Alias từ API cũ */
  name?: string
  place_id?: string
  gmap_id?: string
  latitude?: number
  longitude?: number
  address?: string
  formatted_address?: string
  [key: string]: unknown
}
