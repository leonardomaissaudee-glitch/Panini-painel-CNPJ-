import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import {
  canTrackPageview,
  getAppSection,
  getOrCreateMonitoringSessionId,
  getTrackingReferrer,
  sendAccessEvent,
  shouldSkipTracking,
} from "@/features/monitoring/services/monitoringService"

function buildPayload(pathname: string, search: string, eventType: "pageview" | "heartbeat") {
  const queryParams = Object.fromEntries(new URLSearchParams(search).entries())
  const path = `${pathname}${search}`

  return {
    eventType,
    sessionId: getOrCreateMonitoringSessionId(),
    path,
    method: "GET",
    host: window.location.host,
    referer: getTrackingReferrer(),
    queryParams,
    language: navigator.language || "",
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    pageTitle: document.title || "",
    appSection: getAppSection(pathname),
    extra: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
    },
  }
}

export function useAccessTracking() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === "undefined") return
    if (shouldSkipTracking(location.pathname)) return

    const pathKey = `${location.pathname}${location.search}`

    if (canTrackPageview(pathKey)) {
      void sendAccessEvent(buildPayload(location.pathname, location.search, "pageview")).catch(() => undefined)
    }

    const heartbeat = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return
      void sendAccessEvent(buildPayload(location.pathname, location.search, "heartbeat")).catch(() => undefined)
    }

    const intervalId = window.setInterval(heartbeat, 60_000)

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        heartbeat()
      }
    }

    window.addEventListener("focus", heartbeat)
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", heartbeat)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [location.pathname, location.search])
}
