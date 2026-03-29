export const DEFAULT_MANAGER_WHATSAPP = "5528992771327"

export const ACCOUNT_MANAGERS = [
  {
    name: "Jorge Augusto Araujo",
    whatsapp: DEFAULT_MANAGER_WHATSAPP,
  },
  {
    name: "Andrea Coimbra Azevedo",
    whatsapp: DEFAULT_MANAGER_WHATSAPP,
  },
] as const

export type AccountManagerName = (typeof ACCOUNT_MANAGERS)[number]["name"]

export function getManagerByName(name?: string | null) {
  if (!name) {
    return null
  }

  return ACCOUNT_MANAGERS.find((manager) => manager.name === name) ?? null
}
