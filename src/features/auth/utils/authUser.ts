import type { User } from "@supabase/supabase-js"

export function isAnonymousAuthUser(user?: User | null) {
  return Boolean((user as (User & { is_anonymous?: boolean }) | null | undefined)?.is_anonymous)
}
