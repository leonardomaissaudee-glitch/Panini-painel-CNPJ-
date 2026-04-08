export function normalizeManagerReferralCode(value?: string | null) {
  if (typeof value !== "string") return null
  const normalized = value.trim().toUpperCase()
  return normalized || null
}

export function getPublicSiteBaseUrl() {
  const envUrl =
    import.meta.env.VITE_PUBLIC_SITE_URL ||
    import.meta.env.VITE_SITE_URL ||
    import.meta.env.VITE_APP_URL

  if (typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "")
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "")
  }

  return ""
}

export function buildManagerReferralLink(referralCode?: string | null, baseUrl = getPublicSiteBaseUrl()) {
  const normalizedCode = normalizeManagerReferralCode(referralCode)
  if (!normalizedCode) return ""
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "")
  return `${normalizedBaseUrl}/cadastro?ref=${encodeURIComponent(normalizedCode)}`
}
