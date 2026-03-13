/**
 * Entry point: quét sân bóng Việt Nam qua GMapsExtractor API
 * Cần set GMAPSEXTRACTOR_TOKEN trong .env
 */

import 'dotenv/config'
import { StadiumScraper } from './StadiumScraper.js'

const scraper = new StadiumScraper()
const PROVINCES = ['Hà Nội']

console.log('Starting stadium scrape for:', PROVINCES.join(', '), '\n')

scraper.runForProvinces(PROVINCES).catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
