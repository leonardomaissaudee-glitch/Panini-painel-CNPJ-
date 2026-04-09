const DEFAULT_ORDER_DELIVERY_DAYS = 15

function padDatePart(value: number) {
  return String(value).padStart(2, "0")
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

export function parseDateOnly(value?: string | null) {
  const normalized = value?.trim()
  if (!normalized) return null

  const match = normalized.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) {
    const [, year, month, day] = match
    const parsed = new Date(Number(year), Number(month) - 1, Number(day))
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return null
  return startOfDay(parsed)
}

export function toDateInputValue(date?: Date | null) {
  if (!date) return ""
  return `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`
}

export function getDefaultEstimatedDeliveryDate(baseValue?: string | Date | null) {
  const baseDate =
    baseValue instanceof Date
      ? new Date(baseValue)
      : baseValue
        ? new Date(baseValue)
        : new Date()

  if (Number.isNaN(baseDate.getTime())) return null

  const estimatedDate = startOfDay(baseDate)
  estimatedDate.setDate(estimatedDate.getDate() + DEFAULT_ORDER_DELIVERY_DAYS)
  return estimatedDate
}

export function resolveOrderEstimatedDeliveryDate({
  estimatedDeliveryDate,
  createdAt,
}: {
  estimatedDeliveryDate?: string | null
  createdAt?: string | null
}) {
  return parseDateOnly(estimatedDeliveryDate) ?? getDefaultEstimatedDeliveryDate(createdAt)
}

export function getOrderEstimatedDeliveryLabel({
  estimatedDeliveryDate,
  createdAt,
}: {
  estimatedDeliveryDate?: string | null
  createdAt?: string | null
}) {
  const date = resolveOrderEstimatedDeliveryDate({ estimatedDeliveryDate, createdAt })
  if (!date) return "-"

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}
