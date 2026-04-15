import express from 'express'
import path from 'path'
import fs from 'fs'
import cors from 'cors'
import { BigWig } from '@gmod/bbi'

const app = express()
app.use(express.json())
app.use(cors())

const BIGWIGS = '$1',
  NORM_FACTORS = '$2',
  normTable = {}
if (fs.existsSync(NORM_FACTORS)) {
  const normLines = fs.readFileSync(NORM_FACTORS, 'utf-8').split('\n'),
    normHeader = normLines[0].split('\t')
  for (let i = 1; i < normLines.length; i++) {
    let line = normLines[i].trim()
    if (line === '') {continue}
    let cols = line.split('\t')
    if (cols.length !== normHeader.length) {
      console.warn('Skipping malformed line in normalization factors table: ' + line)
      continue
    }
    let name = cols[0]
    normTable[name] = {}
    for (let j = 1; j < cols.length; j++) {
      normTable[name][normHeader[j]] = parseFloat(cols[j]) || 1
    }
  }
}

app.post('/api/bigwig/pileup', async (req, res) => {
  try {
    const { forward, reverse, ranges } = req.body

    if (!forward || !reverse || !ranges || !Array.isArray(ranges)) {
      return res.status(400).json({ error: 'Invalid request format' })
    }

    let forwardBW, reverseBW
    
    if (forward.startsWith('http://') || forward.startsWith('https://')) {
      forwardBW = new BigWig({ url: forward })
    } else {
      const forwardPath = path.resolve(forward)
      if (!fs.existsSync(forwardPath)) {
        return res.status(404).json({ error: 'File not found' })
      }
      forwardBW = new BigWig({ path: forwardPath })
    }
    
    if (reverse.startsWith('http://') || reverse.startsWith('https://')) {
      reverseBW = new BigWig({ url: reverse })
    } else {
      const reversePath = path.resolve(reverse)
      if (!fs.existsSync(reversePath)) {
        return res.status(404).json({ error: 'File not found' })
      }
      reverseBW = new BigWig({ path: reversePath })
    }

    let forwardPromises = ranges.map(range => forwardBW.getFeatures(range.chrom, range.start, range.end)),
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
    const table = fs.readFileSync(BIGWIGS, 'utf-8').split('\n'),
      header = table[0].split('\t'),
      fields = {},
      BWPairs = []
    for (let i in header) {
      fields[header[i]] = parseInt(i)
    }
    for (let i = 1; i < table.length; i++) {
      let line = table[i].trim()
      if (line === '') {continue}
      let cols = line.split('\t')
      if (cols.length !== header.length) {
        console.warn('Skipping malformed line in bigwig list: ' + line)
        continue
      }
      BWPairs.push({
        name: cols[fields['name']],
        forward: cols[fields['forward']],
        reverse: cols[fields['reverse']]
      })
    }
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

    if (!normTable[sample] || !normTable[sample][method]) {
      res.json({ sample, method, normFactor: 1 })
    } else {
      res.json({ sample, method, normFactor: normTable[sample][method] })
    }
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Standardize index location
app.use(express.static('$(dirname $(dirname $(realpath $0)))'))
app.listen(3000)
