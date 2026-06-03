import { spawn } from 'node:child_process'
import process from 'node:process'
import puppeteer from 'puppeteer'

const host = '127.0.0.1'
const port = 5150
const baseUrl = process.env.QA_BASE_URL ?? `http://${host}:${port}`
const shouldStartServer = !process.env.QA_BASE_URL

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

async function evaluateLogin(page) {
  await page.waitForSelector('.roomin-login-copyright', { visible: true, timeout: 10_000 })

  return page.evaluate(() => {
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
        href.includes('fonts.googleapis.com') &&
        (href.includes('Inter') || href.includes('Plus+Jakarta') || href.includes('Pretendard'))
      )),
      legalVisible: isVisible(legal),
      materialSymbolsStylesheet: stylesheets.some((href) => href.includes('Material+Symbols+Outlined')),
      overlapLegalCopyright: intersects(legal, copyright),
      overlapTitleActions: intersects(title, actions),
      pretendardReady: document.fonts.check('16px Pretendard'),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }
  })
}

async function evaluateLegal(page) {
  await page.waitForSelector('body', { visible: true, timeout: 10_000 })
  await delay(1_000)

  return page.evaluate(() => {
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
        href.includes('fonts.googleapis.com') &&
        (href.includes('Inter') || href.includes('Plus+Jakarta') || href.includes('Pretendard'))
      )),
      headingVisible: headings.length > 0,
      headings,
      materialSymbolFontFamily: materialSymbol ? getComputedStyle(materialSymbol).fontFamily : null,
      materialSymbolText: materialSymbol?.textContent?.trim() ?? '',
      materialSymbolVisible: isVisible(materialSymbol),
      pretendardReady: document.fonts.check('16px Pretendard'),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    }
  })
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

    const beforeReload = scenario.kind === 'login'
      ? await evaluateLogin(page)
      : await evaluateLegal(page)

    await page.reload({ waitUntil: 'networkidle0', timeout: 30_000 })

    const afterReload = scenario.kind === 'login'
      ? await evaluateLogin(page)
      : await evaluateLegal(page)

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
      if (!snapshot.materialSymbolsStylesheet) failures.push(`${result.name} ${phase}: Material Symbols stylesheet missing`)
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

const scenarios = [
  {
    name: 'login desktop',
    kind: 'login',
    path: '/login',
    viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
  },
  {
    name: 'login mobile',
    kind: 'login',
    path: '/login',
    viewport: { width: 390, height: 844, isMobile: true, deviceScaleFactor: 2 },
  },
  {
    name: 'terms desktop',
    kind: 'legal',
    path: '/legal/terms',
    viewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
  },
]

let serverProcess
let browser
try {
  if (shouldStartServer) {
    serverProcess = startServer()
  }

  await waitForServer(baseUrl)

  browser = await puppeteer.launch({ headless: true })
  const results = []
  for (const scenario of scenarios) {
    results.push(await checkScenario(browser, scenario))
  }

  const failures = results.flatMap(collectFailures)

  console.log(JSON.stringify({ baseUrl, results, failures }, null, 2))

  if (failures.length > 0) {
    process.exitCode = 1
  }
} finally {
  await browser?.close()
  await stopServer(serverProcess)
}
