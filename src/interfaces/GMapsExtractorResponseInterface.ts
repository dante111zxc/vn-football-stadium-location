import type { IGMapsExtractorPlace } from './GMapsExtractorPlaceInterface.ts'

/** Response body từ GMapsExtractor API */
export interface IGMapsExtractorResponse {
  results?: IGMapsExtractorPlace[]
  data?: IGMapsExtractorPlace[]
  places?: IGMapsExtractorPlace[]
  [key: string]: unknown
}
