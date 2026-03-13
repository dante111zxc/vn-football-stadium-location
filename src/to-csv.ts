/**
 * Convert stadiums.json sang CSV
 * Chạy: npm run to-csv
 */

import { StadiumCsvConverter } from './StadiumCsvConverter.js'
import { OUTPUT_STADIUMS_PATH } from './config/constants.js'

const converter = new StadiumCsvConverter()
converter.convert(OUTPUT_STADIUMS_PATH)
