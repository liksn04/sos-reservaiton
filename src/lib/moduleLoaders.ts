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
  pendingApproval: withCachedLoader(() => import('../routes/PendingApproval')),
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
  pending: withCachedLoader(() => import('../components/admin/PendingTab')),
  members: withCachedLoader(() => import('../components/admin/MembersTab')),
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
  '/pending-approval': routeModuleLoaders.pendingApproval,
  '/profile/setup': routeModuleLoaders.profileSetup,
  '/banned': routeModuleLoaders.banned,
} as const

export type PrefetchableRoutePath = keyof typeof routePathToLoader
export type PrefetchableAdminTab = keyof typeof adminTabModuleLoaders

export function prefetchRouteModule(path: PrefetchableRoutePath) {
  return routePathToLoader[path]?.()
}

export function prefetchAdminTabModule(tab: PrefetchableAdminTab) {
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
