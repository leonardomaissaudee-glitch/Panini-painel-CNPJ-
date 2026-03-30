import { supabase } from "@/shared/services/supabaseClient"
import type {
  AccessLogFilters,
  AccessLogResult,
  MonitoringDashboardData,
  MonitoringRangePreset,
  TrackAccessPayload,
} from "@/features/monitoring/types"

const TRACKING_ENDPOINT = "/.netlify/functions/track-access"
const MONITORING_SESSION_KEY = "panini-monitoring-session-id"
const LAST_PAGEVIEW_KEY = "panini-monitoring-last-pageview"

export function getOrCreateMonitoringSessionId() {
  if (typeof window === "undefined") return ""

  const cached = window.localStorage.getItem(MONITORING_SESSION_KEY)
  if (cached) return cached

  const nextId = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  window.localStorage.setItem(MONITORING_SESSION_KEY, nextId)
  return nextId
}

export function shouldSkipTracking(pathname: string) {
  return pathname.startsWith("/.netlify/") || pathname.startsWith("/favicon") || pathname.startsWith("/robots")
}

export function canTrackPageview(pathKey: string) {
  if (typeof window === "undefined") return false

  const now = Date.now()
  const previous = window.sessionStorage.getItem(LAST_PAGEVIEW_KEY)

  if (previous) {
    try {
      const parsed = JSON.parse(previous) as { pathKey: string; at: number }
      if (parsed.pathKey === pathKey && now - parsed.at < 5000) {
        return false
      }
    } catch {
      // ignore bad storage payload
    }
  }

  window.sessionStorage.setItem(LAST_PAGEVIEW_KEY, JSON.stringify({ pathKey, at: now }))
  return true
}

export function getMonitoringPresetRange(preset: MonitoringRangePreset) {
  const now = new Date()

  if (preset === "today") {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return { start: start.toISOString(), end: now.toISOString() }
  }

  const days = preset === "7d" ? 7 : 30
  const start = new Date(now)
  start.setDate(now.getDate() - (days - 1))
  start.setHours(0, 0, 0, 0)

  return { start: start.toISOString(), end: now.toISOString() }
}

export function getTrackingReferrer() {
  if (typeof window === "undefined") return ""

  const key = "panini-monitoring-referrer"
  const existing = window.sessionStorage.getItem(key)
  if (existing) return existing

  const referrer = document.referrer || ""
  window.sessionStorage.setItem(key, referrer)
  return referrer
}

export function getAppSection(pathname: string) {
  if (pathname.startsWith("/admin")) return "admin"
  if (pathname.startsWith("/seller")) return "seller"
  if (pathname.startsWith("/app")) return "client"
  if (pathname.startsWith("/painel")) return "auth"
  return "site"
}

export async function sendAccessEvent(payload: TrackAccessPayload) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const response = await fetch(TRACKING_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    },
    body: JSON.stringify(payload),
    keepalive: true,
  })

  if (!response.ok) {
    throw new Error(`tracking_failed_${response.status}`)
  }
}

export async function fetchMonitoringDashboard(preset: MonitoringRangePreset) {
  const { start, end } = getMonitoringPresetRange(preset)
  const { data, error } = await supabase.rpc("admin_get_access_dashboard", {
    p_start: start,
    p_end: end,
  })

  if (error) throw error

  return (data ?? {
    accesses_today: 0,
    accesses_last_7_days: 0,
    visitors_online_now: 0,
    top_page: null,
    top_country: null,
    accesses_by_day: [],
    top_pages: [],
    top_countries: [],
    top_devices: [],
    top_referrers: [],
    online_visitors: [],
    range_start: start,
    range_end: end,
  }) as MonitoringDashboardData
}

export async function fetchAccessLogs(filters: AccessLogFilters) {
  const { start, end } = getMonitoringPresetRange(filters.preset)

  const { data, error } = await supabase.rpc("admin_get_access_logs", {
    p_limit: filters.pageSize,
    p_offset: (filters.page - 1) * filters.pageSize,
    p_search: filters.search || null,
    p_path: filters.path || null,
    p_ip: filters.ip || null,
    p_start: start,
    p_end: end,
  })

  if (error) throw error

  return (data ?? { total: 0, rows: [] }) as AccessLogResult
}
