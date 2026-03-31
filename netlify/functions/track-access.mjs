import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  }
}

function normalizeText(value, maxLength = 500) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  if (!normalized) return null
  return normalized.slice(0, maxLength)
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {}
}

function parseIp(headers) {
  const forwardedFor = headers["x-forwarded-for"] || headers["X-Forwarded-For"]
  const preferred =
    headers["x-nf-client-connection-ip"] ||
    headers["client-ip"] ||
    headers["cf-connecting-ip"] ||
    (typeof forwardedFor === "string" ? forwardedFor.split(",")[0] : null)

  return normalizeText(preferred, 128)
}

function parseGeo(headers) {
  const rawGeo = headers["x-nf-geo"]
  if (typeof rawGeo === "string" && rawGeo.trim()) {
    try {
      const geo = JSON.parse(rawGeo)
      return {
        country: normalizeText(geo.country?.name || geo.country?.code || headers["x-country-name"] || headers["x-country"], 120),
        city: normalizeText(geo.city || headers["x-city"], 120),
        region: normalizeText(geo.subdivision?.name || geo.region || headers["x-region"], 120),
      }
    } catch {
      // ignore malformed geo header
    }
  }

  return {
    country: normalizeText(headers["x-country-name"] || headers["x-country"], 120),
    city: normalizeText(headers["x-city"], 120),
    region: normalizeText(headers["x-region"], 120),
  }
}

function parseUserAgent(userAgent) {
  const ua = userAgent || ""
  const lower = ua.toLowerCase()

  let browser = "Desconhecido"
  if (/edg\//i.test(ua)) browser = "Edge"
  else if (/opr\//i.test(ua)) browser = "Opera"
  else if (/chrome\//i.test(ua)) browser = "Chrome"
  else if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) browser = "Safari"
  else if (/firefox\//i.test(ua)) browser = "Firefox"
  else if (/msie|trident/i.test(ua)) browser = "Internet Explorer"

  let os = "Desconhecido"
  if (/windows/i.test(ua)) os = "Windows"
  else if (/android/i.test(ua)) os = "Android"
  else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS"
  else if (/mac os x|macintosh/i.test(ua)) os = "macOS"
  else if (/linux/i.test(ua)) os = "Linux"

  let deviceType = "desktop"
  if (/ipad|tablet/i.test(ua)) deviceType = "tablet"
  else if (/mobi|iphone|android/i.test(lower)) deviceType = "mobile"

  return { browser, os, deviceType }
}

function normalizePayload(payload) {
  const eventType = payload?.eventType === "heartbeat" ? "heartbeat" : "pageview"
  const sessionId = normalizeText(payload?.sessionId, 120)
  const path = normalizeText(payload?.path, 500)

  if (!sessionId || !path) {
    return null
  }

  return {
    eventType,
    sessionId,
    path,
    method: normalizeText(payload?.method, 16) || "GET",
    host: normalizeText(payload?.host, 255),
    referer: normalizeText(payload?.referer, 1000),
    language: normalizeText(payload?.language, 32),
    screenResolution: normalizeText(payload?.screenResolution, 32),
    pageTitle: normalizeText(payload?.pageTitle, 255),
    appSection: normalizeText(payload?.appSection, 32),
    queryParams: normalizeObject(payload?.queryParams),
    extra: normalizeObject(payload?.extra),
  }
}

async function resolveIdentity(supabase, headers) {
  const authHeader = headers.authorization || headers.Authorization
  const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : null

  if (!token) {
    return {
      auth_user_id: null,
      user_name: null,
      user_role: null,
    }
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return {
      auth_user_id: null,
      user_name: null,
      user_role: null,
    }
  }

  const pickProfile = (rows = []) => rows[0] ?? null

  let profile = null

  try {
    const { data: byAuthProfiles } = await supabase
      .from("profiles")
      .select("auth_user_id, full_name, email, role")
      .eq("auth_user_id", user.id)
      .limit(5)

    profile = pickProfile(byAuthProfiles || [])

    if (!profile && user.email) {
      const { data: byEmailProfiles } = await supabase
        .from("profiles")
        .select("auth_user_id, full_name, email, role")
        .eq("email", user.email)
        .limit(5)

      profile = pickProfile(byEmailProfiles || [])
    }

    if (!profile && user.email) {
      const { data: byInsensitiveEmailProfiles } = await supabase
        .from("profiles")
        .select("auth_user_id, full_name, email, role")
        .ilike("email", user.email)
        .limit(5)

      profile = pickProfile(byInsensitiveEmailProfiles || [])
    }
  } catch {
    profile = null
  }

  let reseller = null
  try {
    const { data } = await supabase
      .from("reseller_profiles")
      .select("user_id, razao_social")
      .eq("user_id", user.id)
      .maybeSingle()
    reseller = data
  } catch {
    reseller = null
  }

  return {
    auth_user_id: user.id,
    user_name:
      reseller?.razao_social ||
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.email ||
      null,
    user_role: reseller ? "cliente" : profile?.role || null,
  }
}

async function upsertVisitorSession(supabase, payload) {
  const { error } = await supabase.from("visitor_sessions").upsert(payload, {
    onConflict: "session_id",
  })

  if (!error) return

  const fallbackPayload = { ...payload }
  delete fallbackPayload.auth_user_id
  delete fallbackPayload.user_name
  delete fallbackPayload.user_role

  const { error: fallbackError } = await supabase.from("visitor_sessions").upsert(fallbackPayload, {
    onConflict: "session_id",
  })

  if (fallbackError) throw fallbackError
}

async function insertAccessLog(supabase, payload) {
  const { error } = await supabase.from("access_logs").insert(payload)
  if (!error) return

  const fallbackPayload = { ...payload }
  delete fallbackPayload.auth_user_id
  delete fallbackPayload.user_name
  delete fallbackPayload.user_role

  const { error: fallbackError } = await supabase.from("access_logs").insert(fallbackPayload)
  if (fallbackError) throw fallbackError
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" }
  }

  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { ok: false, error: "monitoring_env_missing" })
  }

  let parsedBody
  try {
    parsedBody = JSON.parse(event.body || "{}")
  } catch {
    return json(400, { ok: false, error: "invalid_json" })
  }

  const payload = normalizePayload(parsedBody)
  if (!payload) {
    return json(400, { ok: false, error: "invalid_payload" })
  }

  const headers = event.headers || {}
  const ip = parseIp(headers)
  const geo = parseGeo(headers)
  const userAgent = normalizeText(headers["user-agent"] || headers["User-Agent"], 1000)
  const { browser, os, deviceType } = parseUserAgent(userAgent)

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const identity = await resolveIdentity(supabase, headers)

  const sessionPayload = {
    session_id: payload.sessionId,
    auth_user_id: identity.auth_user_id,
    user_name: identity.user_name,
    user_role: identity.user_role,
    ip,
    country: geo.country,
    city: geo.city,
    region: geo.region,
    user_agent: userAgent,
    browser,
    os,
    device_type: deviceType,
    path: payload.path,
    host: payload.host || normalizeText(headers.host || headers.Host, 255),
    referer: payload.referer,
    language: payload.language,
    screen_resolution: payload.screenResolution,
    page_title: payload.pageTitle,
    app_section: payload.appSection,
    last_seen: new Date().toISOString(),
    extra: payload.extra,
  }

  try {
    await upsertVisitorSession(supabase, sessionPayload)
  } catch (sessionError) {
    console.error("track-access visitor_sessions error", sessionError)
    return json(200, { ok: false, skipped: true, error: "session_upsert_failed" })
  }

  if (payload.eventType === "pageview") {
    const dedupeThreshold = new Date(Date.now() - 10_000).toISOString()
    const { data: recentLogs, error: recentLogsError } = await supabase
      .from("access_logs")
      .select("id")
      .eq("session_id", payload.sessionId)
      .eq("path", payload.path)
      .gte("created_at", dedupeThreshold)
      .limit(1)

    if (recentLogsError) {
      console.error("track-access access_logs check error", recentLogsError)
    }

    if (!recentLogs?.length) {
      try {
        await insertAccessLog(supabase, {
          session_id: payload.sessionId,
          auth_user_id: identity.auth_user_id,
          user_name: identity.user_name,
        user_role: identity.user_role,
        ip,
        country: geo.country,
        city: geo.city,
        region: geo.region,
        user_agent: userAgent,
        browser,
        os,
        device_type: deviceType,
        referer: payload.referer,
        path: payload.path,
        method: payload.method,
        host: payload.host || normalizeText(headers.host || headers.Host, 255),
        query_params: payload.queryParams,
        language: payload.language,
          screen_resolution: payload.screenResolution,
          page_title: payload.pageTitle,
          app_section: payload.appSection,
          extra: payload.extra,
        })
      } catch (accessError) {
        console.error("track-access access_logs insert error", accessError)
        return json(200, { ok: false, skipped: true, error: "access_log_insert_failed" })
      }
    }
  }

  return json(200, { ok: true })
}
