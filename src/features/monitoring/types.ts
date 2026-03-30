export type MonitoringRangePreset = "today" | "7d" | "30d"

export interface AccessSummaryDatum {
  label: string
  total: number
}

export interface AccessByDayDatum {
  day: string
  total: number
}

export interface MonitoringDashboardData {
  accesses_today: number
  accesses_last_7_days: number
  visitors_online_now: number
  top_page: AccessSummaryDatum | null
  top_country: AccessSummaryDatum | null
  accesses_by_day: AccessByDayDatum[]
  top_pages: AccessSummaryDatum[]
  top_countries: AccessSummaryDatum[]
  top_devices: AccessSummaryDatum[]
  top_referrers: AccessSummaryDatum[]
  range_start: string | null
  range_end: string | null
}

export interface AccessLogRow {
  id: string
  created_at: string
  ip: string | null
  country: string | null
  city: string | null
  region: string | null
  path: string
  browser: string | null
  os: string | null
  device_type: string | null
  referer: string | null
  host: string | null
  session_id: string
  app_section: string | null
  language: string | null
  screen_resolution: string | null
  page_title: string | null
  user_agent: string | null
  last_seen: string | null
  is_online: boolean
}

export interface AccessLogResult {
  total: number
  rows: AccessLogRow[]
}

export interface AccessLogFilters {
  preset: MonitoringRangePreset
  search: string
  path: string
  ip: string
  page: number
  pageSize: number
}

export interface TrackAccessPayload {
  eventType: "pageview" | "heartbeat"
  sessionId: string
  path: string
  method: string
  host: string
  referer: string
  queryParams: Record<string, string>
  language: string
  screenResolution: string
  pageTitle: string
  appSection: string
  extra: Record<string, unknown>
}
