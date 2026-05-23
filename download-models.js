import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
const MODELS_DIR = path.join(__dirname, 'public', 'models')

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
]

async function downloadFile(filename) {
  const url = `${BASE_URL}/${filename}`
  const dest = path.join(MODELS_DIR, filename)
  
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`))
        return
      }
      
      const file = fs.createWriteStream(dest)
      response.pipe(file)
      file.on('finish', () => {
        file.close()
        console.log(`Downloaded: ${filename}`)
        resolve()
      })
    }).on('error', (err) => {
      fs.unlink(dest, () => {})
      reject(err)
    })
  })
}

async function main() {
  if (!fs.existsSync(MODELS_DIR)) {
    fs.mkdirSync(MODELS_DIR, { recursive: true })
  }
  
  console.log('Starting model downloads...')
  for (const file of files) {
    try {
      await downloadFile(file)
    } catch (err) {
      console.error(err.message)
    }
  }
  console.log('All downloads completed.')
}

main()
