type ModuleLoader<TModule> = () => Promise<TModule>

function withCachedLoader<TModule>(loader: ModuleLoader<TModule>): ModuleLoader<TModule> {
  let promise: Promise<TModule> | null = null

  return () => {
    if (!promise) {
      promise = loader()
    }

    return promise
  }
}

export const routeModuleLoaders = {
  login: withCachedLoader(() => import('../routes/Login')),
  profileSetup: withCachedLoader(() => import('../routes/ProfileSetup')),
  appShell: withCachedLoader(() => import('../routes/AppShell')),
  home: withCachedLoader(() => import('../routes/HomeRoute')),
  reserve: withCachedLoader(() => import('../routes/Reserve')),
  events: withCachedLoader(() => import('../routes/EventsRoute')),
  budget: withCachedLoader(() => import('../routes/BudgetRoute')),
  profile: withCachedLoader(() => import('../routes/ProfileRoute')),
  admin: withCachedLoader(() => import('../routes/Admin')),
  banned: withCachedLoader(() => import('../routes/BannedPage')),
  offlineBanner: withCachedLoader(() => import('../components/OfflineBanner')),
  updatePrompt: withCachedLoader(() => import('../components/UpdatePrompt')),
  budgetCharts: withCachedLoader(() => import('../components/BudgetCharts')),
} as const

export const adminTabModuleLoaders = {
  members: withCachedLoader(() => import('../components/admin/MembersTab')),
  policy: withCachedLoader(() => import('../components/admin/ReservationPolicyTab')),
  banned: withCachedLoader(() => import('../components/admin/BannedTab')),
  logs: withCachedLoader(() => import('../components/admin/LogsTab')),
} as const

const routePathToLoader = {
  '/': routeModuleLoaders.home,
  '/reserve': routeModuleLoaders.reserve,
  '/events': routeModuleLoaders.events,
  '/profile': routeModuleLoaders.profile,
  '/admin': routeModuleLoaders.admin,
  '/budget': routeModuleLoaders.budget,
  '/login': routeModuleLoaders.login,
  '/profile/setup': routeModuleLoaders.profileSetup,
  '/banned': routeModuleLoaders.banned,
} as const

export type PrefetchableRoutePath = keyof typeof routePathToLoader
export type PrefetchableAdminTab = keyof typeof adminTabModuleLoaders

interface PrefetchOptions {
  respectHeavyRouteBudget?: boolean
}

interface NavigatorWithConnection extends Navigator {
  connection?: {
    effectiveType?: string
    saveData?: boolean
  }
}

const HEAVY_ROUTE_PATHS = new Set<PrefetchableRoutePath>(['/admin', '/budget'])
const SLOW_CONNECTION_TYPES = new Set(['slow-2g', '2g'])

export function shouldPrefetchHeavyRoute() {
  const globalWindow = typeof window !== 'undefined' ? window : undefined

  if (!globalWindow) {
    return false
  }

  const connection = (globalWindow.navigator as NavigatorWithConnection).connection

  if (connection?.saveData) {
    return false
  }

  if (connection?.effectiveType && SLOW_CONNECTION_TYPES.has(connection.effectiveType)) {
    return false
  }

  return true
}

export function prefetchRouteModule(path: PrefetchableRoutePath, options?: PrefetchOptions) {
  if (options?.respectHeavyRouteBudget && HEAVY_ROUTE_PATHS.has(path) && !shouldPrefetchHeavyRoute()) {
    return undefined
  }

  return routePathToLoader[path]?.()
}

export function prefetchAdminTabModule(tab: PrefetchableAdminTab, options?: PrefetchOptions) {
  if (options?.respectHeavyRouteBudget && !shouldPrefetchHeavyRoute()) {
    return undefined
  }

  return adminTabModuleLoaders[tab]?.()
}

export function scheduleIdlePrefetch(task: () => void, delay = 250) {
  const globalWindow = typeof window !== 'undefined' ? window : undefined

  if (!globalWindow) {
    return () => undefined
  }

  if (typeof globalWindow.requestIdleCallback === 'function') {
    const idleId = globalWindow.requestIdleCallback(task, { timeout: 1500 })
    return () => globalWindow.cancelIdleCallback?.(idleId)
  }

  const timeoutId = globalThis.setTimeout(task, delay)
  return () => globalThis.clearTimeout(timeoutId)
}
