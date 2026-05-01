import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const distDir = path.resolve('dist')
const assetsDir = path.join(distDir, 'assets')
const maxJsBytes = 500 * 1024
const warnCssBytes = 90 * 1024
const maxPrecacheBytes = Math.ceil(1.97 * 1024 * 1024 * 1.1)

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
  }

  return `${(bytes / 1024).toFixed(1)} KiB`
}

async function getAssetEntries() {
  const files = await readdir(assetsDir)
  const entries = await Promise.all(
    files.map(async (file) => {
      const absolutePath = path.join(assetsDir, file)
      const stats = await stat(absolutePath)
      return {
        file: `assets/${file}`,
        bytes: stats.size,
        ext: path.extname(file),
      }
    }),
  )

  return entries.sort((a, b) => b.bytes - a.bytes)
}

function extractPrecacheUrls(swSource) {
  const urls = []
  const pattern = /url:"([^"]+)"/g
  let match = pattern.exec(swSource)

  while (match) {
    urls.push(match[1])
    match = pattern.exec(swSource)
  }

  return urls
}

async function getPrecacheSize() {
  const swPath = path.join(distDir, 'sw.js')
  const swSource = await readFile(swPath, 'utf8')
  const urls = extractPrecacheUrls(swSource)
  let totalBytes = 0

  for (const url of urls) {
    const filePath = path.join(distDir, url)
    try {
      const stats = await stat(filePath)
      totalBytes += stats.size
    } catch {
      // Workbox may include generated entries that are not local files in unusual modes.
    }
  }

  return { totalBytes, count: urls.length }
}

const entries = await getAssetEntries()
const jsEntries = entries.filter((entry) => entry.ext === '.js')
const cssEntries = entries.filter((entry) => entry.ext === '.css')
const { totalBytes: precacheBytes, count: precacheCount } = await getPrecacheSize()

const oversizedJs = jsEntries.filter((entry) => entry.bytes > maxJsBytes)
const oversizedCss = cssEntries.filter((entry) => entry.bytes > warnCssBytes)
const precacheExceeded = precacheBytes > maxPrecacheBytes

console.log('Bundle size report')
console.log('Top JavaScript assets:')
for (const entry of jsEntries.slice(0, 12)) {
  console.log(`- ${entry.file}: ${formatBytes(entry.bytes)}`)
}

if (cssEntries.length > 0) {
  console.log('CSS assets:')
  for (const entry of cssEntries) {
    console.log(`- ${entry.file}: ${formatBytes(entry.bytes)}`)
  }
}

console.log(`Precache: ${precacheCount} entries, ${formatBytes(precacheBytes)}`)

if (oversizedCss.length > 0) {
  console.warn(
    `CSS warning: ${oversizedCss
      .map((entry) => `${entry.file} ${formatBytes(entry.bytes)}`)
      .join(', ')} exceeds ${formatBytes(warnCssBytes)}`,
  )
}

if (precacheExceeded) {
  console.warn(
    `Precache warning: ${formatBytes(precacheBytes)} exceeds ${formatBytes(maxPrecacheBytes)}`,
  )
}

if (oversizedJs.length > 0) {
  console.error(
    `Bundle size check failed: ${oversizedJs
      .map((entry) => `${entry.file} ${formatBytes(entry.bytes)}`)
      .join(', ')} exceeds ${formatBytes(maxJsBytes)}`,
  )
  process.exitCode = 1
}
