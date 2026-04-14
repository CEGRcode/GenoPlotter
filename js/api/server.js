import express from 'express'
import path from 'path'
import fs from 'fs'
import cors from 'cors'
import { BigWig } from '@gmod/bbi'

const app = express()
app.use(express.json())
app.use(cors())

const DATA_DIR = '/var/www/bigwigs/',
  NORM_DIR = '/var/www/normalization_factors/'

// Basic validation helper
function isSafeFilename(filename) {
  return /^[a-zA-Z0-9._-]+$/.test(filename)
}

app.post('/api/bigwig/pileup', async (req, res) => {
  try {
    const { forward, reverse, ranges } = req.body

    if (!forward || !reverse || !ranges || !Array.isArray(ranges)) {
      return res.status(400).json({ error: 'Invalid request format' })
    }

    if (!isSafeFilename(forward) || !isSafeFilename(reverse)) {
      return res.status(400).json({ error: 'Invalid file name' })
    }

    const forwardPath = path.join(DATA_DIR, forward)
    const reversePath = path.join(DATA_DIR, reverse)

    if (!fs.existsSync(forwardPath) || !fs.existsSync(reversePath)) {
      return res.status(404).json({ error: 'File not found' })
    }

    const forwardBW = new BigWig({ path: forwardPath }),
      reverseBW = new BigWig({ path: reversePath }),
      forwardPromises = ranges.map(range => forwardBW.getFeatures(range.chrom, range.start, range.end)),
      reversePromises = ranges.map(range => reverseBW.getFeatures(range.chrom, range.start, range.end))

    const width = ranges[0].end - ranges[0].start,
      results = {
        sense: Array(width).fill(0),
        anti: Array(width).fill(0)
      }

    for (const i in ranges) {
      const forwardFeatures = await forwardPromises[i],
        reverseFeatures = await reversePromises[i],
        range = ranges[i]

      if (range.end - range.start !== width) {
        return res.status(400).json({ error: 'All ranges must have the same width' })
      }

      if (range.strand === '+') {
        for (let fblock of forwardFeatures) {
          let occ = fblock.score
          for (let x = Math.max(fblock.start, range.start); x < Math.min(fblock.end, range.end); x++) {
            results.sense[x - range.start] += occ
          }
        }
        for (let rblock of reverseFeatures) {
          let occ = rblock.score
          for (let x = Math.max(rblock.start, range.start); x < Math.min(rblock.end, range.end); x++) {
            results.anti[x - range.start] += occ
          }
        }
      } else {
        for (let fblock of forwardFeatures) {
          let occ = fblock.score
          for (let x = Math.max(fblock.start, range.start); x < Math.min(fblock.end, range.end); x++) {
            results.anti[range.end - 1 - x] += occ
          }
        }
        for (let rblock of reverseFeatures) {
          let occ = rblock.score
          for (let x = Math.max(rblock.start, range.start); x < Math.min(rblock.end, range.end); x++) {
            results.sense[range.end - 1 - x] += occ
          }
        }
      }
    }

    res.json({
      forward,
      reverse,
      results
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get('/api/bigwig/list', async (_, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR).filter(file => 
        file.endsWith('.forward.bw') &&
          fs.existsSync(path.join(DATA_DIR, file.replace('.forward.bw', '.reverse.bw')))
      ),
      BWPairs = files.map(file => ({
        name: file.replace('.forward.bw', ''),
        forward: file,
        reverse: file.replace('.forward.bw', '.reverse.bw')
      }))
    res.json(BWPairs)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.post('/api/bigwig/normalization', async (req, res) => {
  try {
    const { sample, method } = req.body

    if (!sample || !method) {
      return res.status(400).json({ error: 'Invalid request format' })
    }

    if (!isSafeFilename(sample)) {
      return res.status(400).json({ error: 'Invalid sample name' })
    }

    // TODO: Standardize file name for normalization factor
    const normFile = fs.readdirSync(path.join(NORM_DIR, method)).filter(
      file => file.startsWith(sample) && file.endsWith(method + '.out')
    )

    if (normFile.length === 0) {
      return res.status(404).json({ error: 'Normalization factors not found' })
    }

    if (normFile.length > 1) {
      console.warn(`Multiple normalization files found for sample ${sample} and method ${method}. Returning the first one.`)
    }

    // TODO: Standardize format for normalization factor
    const normFactor = parseFloat(fs.readFileSync(path.join(NORM_DIR, method, normFile[0]), 'utf-8')
      .split('\n')[5].trim().slice(16))
    res.json({ sample, method, normFactor })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Standardize index location
app.use(express.static('/home/ubuntu'))
app.listen(3000)