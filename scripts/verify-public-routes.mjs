import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import process from 'node:process'
import puppeteer from 'puppeteer'

const host = '127.0.0.1'
const port = 5150
const baseUrl = process.env.QA_BASE_URL ?? `http://${host}:${port}`
const shouldStartServer = !process.env.QA_BASE_URL
const evidenceDir = '.omo/evidence'
const task4EvidenceJson = `${evidenceDir}/task-4-public-routes-green.json`
const finalEvidenceJson = `${evidenceDir}/final-icon-key-flash-browser.json`
const googleFontsStylesheetHost = ['fonts', 'googleapis', 'com'].join('.')
const googleFontsAssetHost = ['fonts', 'gstatic', 'com'].join('.')
const materialSymbolsStylesheetToken = ['Material', 'Symbols', 'Outlined'].join('+')
const materialSymbolsFontPath = '/fonts/material-symbols/MaterialSymbolsOutlined.woff2'
const scenarioScreenshotPaths = {
  'login desktop': `${evidenceDir}/task-4-login-desktop.png`,
  'login mobile': `${evidenceDir}/task-4-login-mobile.png`,
  'terms desktop': `${evidenceDir}/task-4-terms-desktop.png`,
  'terms mobile': `${evidenceDir}/task-4-terms-mobile.png`,
}
const delayedFontScreenshotPath = `${evidenceDir}/task-4-terms-delayed.png`
const iconKeyPattern = /^[a-z]+(?:_[a-z0-9]+)+$/
const knownIconKeys = new Set([
  'calendar_month',
  'calendar_today',
  'person',
  'add_circle',
  'arrow_back',
  'schedule',
  'music_note',
  'event_busy',
  'draft',
  'error',
  'groups',
])

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForServer(url, timeoutMs = 30_000) {
  const startedAt = Date.now()

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      // Vite may still be starting.
    }

    await delay(250)
  }

  throw new Error(`Timed out waiting for ${url}`)
}

async function stopServer(serverProcess) {
  if (!serverProcess || serverProcess.exitCode !== null) return

  serverProcess.kill('SIGTERM')

  await new Promise((resolve) => {
    const timeout = setTimeout(() => {
      if (serverProcess.exitCode === null) {
        serverProcess.kill('SIGKILL')
      }
      resolve()
    }, 3_000)

    serverProcess.once('exit', () => {
      clearTimeout(timeout)
      resolve()
    })
  })
}

function startServer() {
  return spawn('npm', ['run', 'dev', '--', '--host', host], {
    stdio: ['ignore', 'ignore', 'ignore'],
    env: process.env,
  })
}

async function collectVisibleIconKeyLeaks(page) {
  return page.evaluate(({ knownKeys, patternSource }) => {
    const iconKeyPattern = new RegExp(patternSource)
    const fontSpec = '24px "Material Symbols Outlined"'
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none' && style.opacity !== '0'
    }
    const normalizeCssContent = (content) => {
      if (!content || content === 'none' || content === 'normal') return ''
      return content.replace(/^["']|["']$/g, '').trim()
    }
    const isTransparentColor = (color) => (
      color === 'transparent' ||
      /^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/.test(color)
    )
    const isIconKey = (value) => knownKeys.includes(value) || iconKeyPattern.test(value)
    const materialSymbolsReady = document.fonts?.check(fontSpec) ?? false

    return [...document.querySelectorAll('.material-symbols-outlined')]
      .map((element) => {
        const text = element.textContent?.trim() ?? ''
        const rect = element.getBoundingClientRect()
        const style = getComputedStyle(element)
        const beforeStyle = getComputedStyle(element, '::before')
        const beforeContent = normalizeCssContent(beforeStyle.content)
        const rawKeyCandidates = [text, beforeContent].filter(isIconKey)
        const materialSymbolsActive = materialSymbolsReady && style.fontFamily.includes('Material Symbols')
        return {
          text,
          beforeContent,
          rawKeyCandidates,
          className: element.getAttribute('class') ?? '',
          color: style.color,
          colorTransparent: isTransparentColor(style.color),
          fontFamily: style.fontFamily,
          materialSymbolsReady,
          materialSymbolsActive,
          rect: {
            width: Math.round(rect.width * 100) / 100,
            height: Math.round(rect.height * 100) / 100,
          },
          visible: isVisible(element),
        }
      })
      .filter((entry) => (
        entry.visible &&
        !entry.colorTransparent &&
        entry.rawKeyCandidates.length > 0 &&
        !entry.materialSymbolsActive
      ))
  }, { knownKeys: [...knownIconKeys], patternSource: iconKeyPattern.source })
}

async function collectMaterialSymbolBoxes(page) {
  return page.evaluate(() => [...document.querySelectorAll('.material-symbols-outlined')].map((element) => {
    const rect = element.getBoundingClientRect()
    const style = getComputedStyle(element)
    return {
      className: element.getAttribute('class') ?? '',
      dataIcon: element.getAttribute('data-icon') ?? '',
      fontFamily: style.fontFamily,
      color: style.color,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100,
      visible: rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none',
    }
  }))
}

async function evaluateLogin(page) {
  await page.waitForSelector('.roomin-login-copyright', { visible: true, timeout: 10_000 })

  return page.evaluate(({ googleFontsStylesheetHost, googleFontsAssetHost, materialSymbolsStylesheetToken }) => {
    const isVisible = (element) => {
      if (!element) return false
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    const intersects = (left, right) => {
      if (!left || !right) return false
      const a = left.getBoundingClientRect()
      const b = right.getBoundingClientRect()
      return !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom)
    }

    const copyright = document.querySelector('.roomin-login-copyright')
    const legal = document.querySelector('.roomin-login-legal')
    const title = document.querySelector('.roomin-login-title')
    const actions = document.querySelector('.roomin-login-actions')
    const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"]')].map((node) => node.href)

    return {
      path: window.location.pathname,
      bodyFontFamily: getComputedStyle(document.body).fontFamily,
      copyrightText: copyright?.textContent?.trim() ?? '',
      copyrightVisible: isVisible(copyright),
      externalAppFontStylesheets: stylesheets.filter((href) => (
        href.includes(googleFontsStylesheetHost) &&
        (href.includes('Inter') || href.includes('Plus+Jakarta') || href.includes('Pretendard'))
      )),
      externalMaterialSymbolsStylesheets: stylesheets.filter((href) => (
        href.includes(googleFontsStylesheetHost) ||
        href.includes(googleFontsAssetHost) ||
        href.includes(materialSymbolsStylesheetToken)
      )),
      legalVisible: isVisible(legal),
      localMaterialSymbolsFontFace: document.fonts.check('24px "Material Symbols Outlined"'),
      materialSymbolsReadyClass: document.documentElement.classList.contains('roomin-material-symbols-ready'),
      overlapLegalCopyright: intersects(legal, copyright),
      overlapTitleActions: intersects(title, actions),
      pretendardReady: document.fonts.check('16px Pretendard'),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }
  }, { googleFontsStylesheetHost, googleFontsAssetHost, materialSymbolsStylesheetToken })
}

async function evaluateLegal(page) {
  await page.waitForSelector('body', { visible: true, timeout: 10_000 })
  await delay(1_000)

  return page.evaluate(({ googleFontsStylesheetHost, googleFontsAssetHost, materialSymbolsStylesheetToken }) => {
    const isVisible = (element) => {
      if (!element) return false
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
    }

    const headings = [...document.querySelectorAll('h1,h2,h3')]
      .map((node) => node.textContent?.trim() ?? '')
      .filter(Boolean)
    const materialSymbol = document.querySelector('.material-symbols-outlined')
    const stylesheets = [...document.querySelectorAll('link[rel="stylesheet"]')].map((node) => node.href)

    return {
      path: window.location.pathname,
      articleVisible: isVisible(document.querySelector('article, main')),
      bodyFontFamily: getComputedStyle(document.body).fontFamily,
      externalAppFontStylesheets: stylesheets.filter((href) => (
        href.includes(googleFontsStylesheetHost) &&
        (href.includes('Inter') || href.includes('Plus+Jakarta') || href.includes('Pretendard'))
      )),
      externalMaterialSymbolsStylesheets: stylesheets.filter((href) => (
        href.includes(googleFontsStylesheetHost) ||
        href.includes(googleFontsAssetHost) ||
        href.includes(materialSymbolsStylesheetToken)
      )),
      headingVisible: headings.length > 0,
      headings,
      localMaterialSymbolsFontFace: document.fonts.check('24px "Material Symbols Outlined"'),
      materialSymbolsReadyClass: document.documentElement.classList.contains('roomin-material-symbols-ready'),
      materialSymbolFontFamily: materialSymbol ? getComputedStyle(materialSymbol).fontFamily : null,
      materialSymbolText: materialSymbol?.textContent?.trim() ?? '',
      materialSymbolVisible: isVisible(materialSymbol),
      pretendardReady: document.fonts.check('16px Pretendard'),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }
  }, { googleFontsStylesheetHost, googleFontsAssetHost, materialSymbolsStylesheetToken })
}

async function setupDelayedMaterialSymbols(page, delayMs = 4_000) {
  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const url = request.url()
    const isExternalMaterialSymbolsFont = url.includes(googleFontsAssetHost) && url.includes('materialsymbols')
    const isLocalMaterialSymbolsFont = url.includes(materialSymbolsFontPath)
    if (isExternalMaterialSymbolsFont || isLocalMaterialSymbolsFont) {
      setTimeout(() => {
        request.continue().catch(() => {})
      }, delayMs)
      return
    }

    request.continue().catch(() => {})
  })
}

async function checkDelayedFontFlash(browser) {
  const page = await browser.newPage()
  const viewport = { width: 1280, height: 720, deviceScaleFactor: 1 }
  const sampleTimes = [0, 250, 1_000, 4_000]
  const samples = []

  try {
    await setupDelayedMaterialSymbols(page)
    await page.setViewport(viewport)
    const startedAt = Date.now()
    await page.goto(`${baseUrl}/legal/terms`, { waitUntil: 'domcontentloaded', timeout: 30_000 })

    for (const targetMs of sampleTimes) {
      const remainingMs = targetMs - (Date.now() - startedAt)
      if (remainingMs > 0) {
        await delay(remainingMs)
      }

      const leaks = await collectVisibleIconKeyLeaks(page)
      const iconBoxes = await collectMaterialSymbolBoxes(page)
      const sample = {
        name: 'terms delayed material symbols',
        path: await page.evaluate(() => window.location.pathname),
        viewport,
        sampleMs: targetMs,
        localMaterialSymbolsFontFace: await page.evaluate(() => document.fonts.check('24px "Material Symbols Outlined"')),
        materialSymbolsReadyClass: await page.evaluate(() => document.documentElement.classList.contains('roomin-material-symbols-ready')),
        iconBoxes,
        leaks,
      }
      samples.push(sample)
    }

    await page.waitForFunction(() => (
      document.fonts.check('24px "Material Symbols Outlined"') &&
      document.documentElement.classList.contains('roomin-material-symbols-ready')
    ), { timeout: 10_000 })

    const finalState = {
      localMaterialSymbolsFontFace: await page.evaluate(() => document.fonts.check('24px "Material Symbols Outlined"')),
      materialSymbolsReadyClass: await page.evaluate(() => document.documentElement.classList.contains('roomin-material-symbols-ready')),
      iconBoxes: await collectMaterialSymbolBoxes(page),
      leaks: await collectVisibleIconKeyLeaks(page),
    }
    await page.screenshot({ path: delayedFontScreenshotPath, fullPage: false })

    return {
      name: 'terms delayed material symbols',
      kind: 'delayed-font',
      path: '/legal/terms',
      viewport,
      samples,
      finalState,
      screenshotPath: delayedFontScreenshotPath,
    }
  } finally {
    await page.close()
  }
}

async function checkScenario(browser, scenario) {
  const page = await browser.newPage()
  const consoleMessages = []

  try {
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning') {
        consoleMessages.push(`${message.type()}: ${message.text()}`)
      }
    })

    await page.setViewport(scenario.viewport)
    await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: 'networkidle0', timeout: 30_000 })

    const beforeReloadSnapshot = scenario.kind === 'login'
      ? await evaluateLogin(page)
      : await evaluateLegal(page)
    const beforeReload = {
      ...beforeReloadSnapshot,
      visibleIconKeyLeaks: await collectVisibleIconKeyLeaks(page),
    }

    await page.reload({ waitUntil: 'networkidle0', timeout: 30_000 })

    const afterReloadSnapshot = scenario.kind === 'login'
      ? await evaluateLogin(page)
      : await evaluateLegal(page)
    const afterReload = {
      ...afterReloadSnapshot,
      visibleIconKeyLeaks: await collectVisibleIconKeyLeaks(page),
    }

    await page.screenshot({ path: scenario.screenshotPath, fullPage: false })

    return {
      ...scenario,
      beforeReload,
      afterReload,
      consoleMessages,
    }
  } finally {
    await page.close()
  }
}

function collectFailures(result) {
  const failures = []

  for (const phase of ['beforeReload', 'afterReload']) {
    const snapshot = result[phase]
    if (!snapshot.pretendardReady) failures.push(`${result.name} ${phase}: Pretendard not ready`)
    if (snapshot.externalAppFontStylesheets.length > 0) failures.push(`${result.name} ${phase}: external app font stylesheet present`)
    if (snapshot.externalMaterialSymbolsStylesheets.length > 0) failures.push(`${result.name} ${phase}: external Material Symbols stylesheet present`)
    if (!snapshot.localMaterialSymbolsFontFace) failures.push(`${result.name} ${phase}: local Material Symbols font face inactive`)
    if (!snapshot.materialSymbolsReadyClass) failures.push(`${result.name} ${phase}: Material Symbols ready class missing`)
    for (const leak of snapshot.visibleIconKeyLeaks) {
      failures.push(`${result.name} ${phase}: visible icon key leak "${leak.rawKeyCandidates[0] ?? leak.text}"`)
    }
  }

  if (result.consoleMessages.length > 0) {
    failures.push(`${result.name}: console messages ${result.consoleMessages.join('; ')}`)
  }

  if (result.kind === 'login') {
    for (const phase of ['beforeReload', 'afterReload']) {
      const snapshot = result[phase]
      if (!snapshot.copyrightVisible) failures.push(`${result.name} ${phase}: copyright not visible`)
      if (!snapshot.copyrightText.includes('© 2026 Junmo Kim')) failures.push(`${result.name} ${phase}: copyright text mismatch`)
      if (!snapshot.legalVisible) failures.push(`${result.name} ${phase}: legal text not visible`)
      if (snapshot.overlapLegalCopyright) failures.push(`${result.name} ${phase}: legal/copyright overlap`)
      if (snapshot.overlapTitleActions) failures.push(`${result.name} ${phase}: title/actions overlap`)
    }
  } else {
    for (const phase of ['beforeReload', 'afterReload']) {
      const snapshot = result[phase]
      if (!snapshot.headingVisible || !snapshot.articleVisible) failures.push(`${result.name} ${phase}: legal document not visible`)
      if (!snapshot.materialSymbolVisible) failures.push(`${result.name} ${phase}: Material Symbols icon not visible`)
      if (!snapshot.materialSymbolFontFamily?.includes('Material Symbols')) failures.push(`${result.name} ${phase}: Material Symbols font inactive`)
    }
  }

  return failures
}

function collectDelayedFontFailures(result) {
  const failures = []

  for (const sample of result.samples) {
    for (const leak of sample.leaks) {
      failures.push(`${result.name} ${sample.sampleMs}ms: visible icon key leak "${leak.rawKeyCandidates[0] ?? leak.text}"`)
    }
    if (sample.sampleMs >= 1_000 && sample.iconBoxes.length === 0) {
      failures.push(`${result.name} ${sample.sampleMs}ms: Material Symbols icon boxes missing`)
    }
    for (const box of sample.iconBoxes) {
      if (box.width <= 0 || box.height <= 0) {
        failures.push(`${result.name} ${sample.sampleMs}ms: Material Symbols icon box has zero dimensions`)
      }
    }
  }

  if (!result.finalState.localMaterialSymbolsFontFace) failures.push(`${result.name} final: local Material Symbols font face inactive`)
  if (!result.finalState.materialSymbolsReadyClass) failures.push(`${result.name} final: Material Symbols ready class missing`)
  for (const leak of result.finalState.leaks) {
    failures.push(`${result.name} final: visible icon key leak "${leak.rawKeyCandidates[0] ?? leak.text}"`)
  }

  return failures
}

const scenarios = [
  {
    name: 'login desktop',
    kind: 'login',
    path: '/login',
    viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
    screenshotPath: scenarioScreenshotPaths['login desktop'],
  },
  {
    name: 'login mobile',
    kind: 'login',
    path: '/login',
    viewport: { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
    screenshotPath: scenarioScreenshotPaths['login mobile'],
  },
  {
    name: 'terms desktop',
    kind: 'legal',
    path: '/legal/terms',
    viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
    screenshotPath: scenarioScreenshotPaths['terms desktop'],
  },
  {
    name: 'terms mobile',
    kind: 'legal',
    path: '/legal/terms',
    viewport: { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
    screenshotPath: scenarioScreenshotPaths['terms mobile'],
  },
]

let serverProcess
let browser
try {
  if (shouldStartServer) {
    serverProcess = startServer()
  }

  await waitForServer(baseUrl)
  await mkdir(evidenceDir, { recursive: true })

  browser = await puppeteer.launch({ headless: true })
  const results = []
  for (const scenario of scenarios) {
    results.push(await checkScenario(browser, scenario))
  }
  const delayedFontResult = await checkDelayedFontFlash(browser)

  const failures = [
    ...results.flatMap(collectFailures),
    ...collectDelayedFontFailures(delayedFontResult),
  ]

  const output = {
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    baseUrl,
    results,
    delayedFontResult,
    failures,
  }
  await writeFile(task4EvidenceJson, `${JSON.stringify(output, null, 2)}\n`)
  await writeFile(finalEvidenceJson, `${JSON.stringify(output, null, 2)}\n`)
  console.log(JSON.stringify(output, null, 2))

  if (failures.length > 0) {
    process.exitCode = 1
  }
} finally {
  await browser?.close()
  await stopServer(serverProcess)
}
