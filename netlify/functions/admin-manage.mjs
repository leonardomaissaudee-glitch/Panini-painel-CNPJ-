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

function asText(value, maxLength = 500) {
  if (typeof value !== "string") return null
  const normalized = value.trim()
  if (!normalized) return null
  return normalized.slice(0, maxLength)
}

function asNullableText(value, maxLength = 500) {
  return asText(value, maxLength)
}

function asNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function asInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function normalizeApprovalStatus(status) {
  switch (status) {
    case "approved":
    case "aprovado":
      return { reseller: "approved", profile: "aprovado" }
    case "rejected":
    case "reprovado":
      return { reseller: "rejected", profile: "reprovado" }
    case "blocked":
    case "bloqueado":
      return { reseller: "blocked", profile: "bloqueado" }
    default:
      return { reseller: "pending", profile: "pendente" }
  }
}

function mapUserType(input) {
  const value = asText(input, 32)?.toLowerCase()

  switch (value) {
    case "admin":
      return { role: "admin", userType: "admin" }
    case "cliente":
      return { role: "client", userType: "cliente" }
    case "gerente":
      return { role: "seller", userType: "gerente" }
    case "atendente":
      return { role: "seller", userType: "atendente" }
    case "vendedor":
    default:
      return { role: "seller", userType: "vendedor" }
  }
}

function toDatabaseOrderStatus(status) {
  const normalized = asText(status, 64) || "aguardando_aprovacao"
  const legacyMap = {
    aguardando_aprovacao: "novo_pedido",
    pedido_pago: "pago",
    em_expedicao: "enviado",
    nota_fiscal_emitida: "nota_fiscal",
    localizador_disponivel: "rastreio",
  }
  return legacyMap[normalized] || normalized
}

function getDiscountTier(subtotal) {
  if (subtotal >= 5000) return { name: "Premium", percentage: 20 }
  if (subtotal >= 2500) return { name: "Standard", percentage: 12 }
  if (subtotal >= 800) return { name: "Classic", percentage: 5 }
  return null
}

function calculateAutomaticOrderPricing(subtotal, paymentMethod) {
  if (paymentMethod === "credit_card") {
    return {
      tier: null,
      planDiscount: 0,
      pixDiscount: 0,
      automaticDiscount: 0,
    }
  }

  const tier = getDiscountTier(subtotal)
  const planDiscount = tier ? Number((subtotal * (tier.percentage / 100)).toFixed(2)) : 0
  const totalAfterPlan = Number((subtotal - planDiscount).toFixed(2))
  const pixDiscount = paymentMethod === "pix" ? Number((totalAfterPlan * 0.05).toFixed(2)) : 0
  const automaticDiscount = Number((planDiscount + pixDiscount).toFixed(2))

  return {
    tier,
    planDiscount,
    pixDiscount,
    automaticDiscount,
  }
}

function buildAddressPayload(values) {
  return {
    cep: values.cep || null,
    endereco: values.endereco || null,
    numero: values.numero || null,
    complemento: values.complemento || null,
    bairro: values.bairro || null,
    cidade: values.cidade || null,
    estado: values.estado || null,
  }
}

function compactObject(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined)
  )
}

const tableSchemaCache = new Map()
const fallbackTableSchemas = {
  profiles: new Map(
    [
      "id",
      "auth_user_id",
      "full_name",
      "email",
      "role",
      "user_type",
      "company_name",
      "status_cadastro",
      "tipo_documento",
      "documento",
      "telefone",
      "endereco",
      "account_manager_user_id",
      "account_manager_name",
      "account_manager_email",
      "account_manager_whatsapp",
      "referral_code",
      "referred_by_manager_user_id",
      "referred_by_manager_name",
      "referred_by_manager_email",
      "referred_by_manager_whatsapp",
      "referral_code_used",
      "signup_origin",
      "notes",
      "deleted_at",
    ].map((column_name) => [column_name, { column_name, udt_name: column_name === "endereco" ? "text" : "text" }])
  ),
  reseller_profiles: new Map(
    [
      "id",
      "user_id",
      "cnpj",
      "razao_social",
      "nome_fantasia",
      "nome_responsavel",
      "email",
      "telefone",
      "whatsapp",
      "cep",
      "endereco",
      "numero",
      "complemento",
      "bairro",
      "cidade",
      "estado",
      "segmento",
      "faixa_investimento",
      "canal_revenda",
      "observacoes",
      "status_cadastro",
      "motivo_reprovacao",
      "account_manager_user_id",
      "account_manager_name",
      "account_manager_email",
      "account_manager_whatsapp",
      "referred_by_manager_user_id",
      "referred_by_manager_name",
      "referred_by_manager_email",
      "referred_by_manager_whatsapp",
      "referral_code_used",
      "signup_origin",
      "updated_at",
    ].map((column_name) => [column_name, { column_name, udt_name: "text" }])
  ),
  orders: new Map(
    [
      "id",
      "cliente_id",
      "customer_name",
      "customer_email",
      "customer_phone",
      "customer_cpf",
      "shipping_street",
      "shipping_number",
      "shipping_complement",
      "shipping_neighborhood",
      "shipping_city",
      "shipping_state",
      "shipping_postal_code",
      "items",
      "subtotal",
      "original_total",
      "automatic_discount_amount",
      "shipping_cost",
      "total",
      "payment_method",
      "payment_status",
      "shipping_method",
      "status",
      "seller_id",
      "updated_at",
    ].map((column_name) => [column_name, { column_name, udt_name: column_name === "items" ? "jsonb" : "text" }])
  ),
}

async function loadTableSchema(supabase, tableName) {
  if (tableSchemaCache.has(tableName)) {
    return tableSchemaCache.get(tableName)
  }

  const { data, error } = await supabase
    .schema("information_schema")
    .from("columns")
    .select("column_name,data_type,udt_name")
    .eq("table_schema", "public")
    .eq("table_name", tableName)

  if (error) {
    const fallback = fallbackTableSchemas[tableName] || new Map()
    tableSchemaCache.set(tableName, fallback)
    return fallback
  }

  const schema = new Map((data || []).map((row) => [row.column_name, row]))
  tableSchemaCache.set(tableName, schema)
  return schema
}

function hasColumn(schema, columnName) {
  return schema instanceof Map && schema.has(columnName)
}

function isTextLikeColumn(schema, columnName) {
  const column = schema instanceof Map ? schema.get(columnName) : null
  const udtName = column?.udt_name
  return udtName === "text" || udtName === "varchar" || udtName === "bpchar"
}

function filterPayloadToSchema(payload, schema) {
  return compactObject(
    Object.fromEntries(Object.entries(payload).filter(([key]) => hasColumn(schema, key)))
  )
}

function adaptLegacyProfilePayload(payload, schema) {
  const normalizedPayload = compactObject({ ...payload })

  if (!hasColumn(schema, "full_name")) {
    const displayName = asNullableText(normalizedPayload.full_name, 255)

    if (displayName && hasColumn(schema, "company_name")) {
      normalizedPayload.company_name = displayName
    }
  }

  const next = filterPayloadToSchema(normalizedPayload, schema)

  if (Object.prototype.hasOwnProperty.call(next, "endereco") && typeof next.endereco === "object" && next.endereco !== null) {
    if (isTextLikeColumn(schema, "endereco")) {
      next.endereco = JSON.stringify(next.endereco)
    }
  }

  return next
}

function normalizeError(error) {
  if (error && typeof error === "object") {
    return {
      message: typeof error.message === "string" ? error.message : "unexpected_error",
      details: typeof error.details === "string" ? error.details : null,
      hint: typeof error.hint === "string" ? error.hint : null,
      code: typeof error.code === "string" ? error.code : null,
    }
  }

  return {
    message: error instanceof Error ? error.message : String(error || "unexpected_error"),
    details: null,
    hint: null,
    code: null,
  }
}

function normalizeUrl(value) {
  const parsed = asNullableText(value, 1000)
  if (!parsed) return null
  try {
    return new URL(parsed).origin.toLowerCase()
  } catch {
    return parsed.toLowerCase()
  }
}

function getMissingColumnFromSchemaError(error, tableName) {
  const message = normalizeError(error).message
  const match = message.match(
    new RegExp(`Could not find the '([^']+)' column of '${tableName}' in the schema cache`, "i")
  )
  return match?.[1] || null
}

async function updateTableWithRetry(supabase, tableName, payload, matchColumn, matchValue) {
  let nextPayload = { ...payload }

  while (true) {
    const { error } = await supabase.from(tableName).update(nextPayload).eq(matchColumn, matchValue)
    if (!error) return nextPayload

    const missingColumn = getMissingColumnFromSchemaError(error, tableName)
    if (missingColumn && Object.prototype.hasOwnProperty.call(nextPayload, missingColumn)) {
      delete nextPayload[missingColumn]
      continue
    }

    throw error
  }
}

async function insertTableWithRetry(supabase, tableName, payload, selectClause = null) {
  let nextPayload = { ...payload }

  while (true) {
    let query = supabase.from(tableName).insert(nextPayload)
    if (selectClause) {
      query = query.select(selectClause).single()
    }

    const { data, error } = await query
    if (!error) return { data, payload: nextPayload }

    const missingColumn = getMissingColumnFromSchemaError(error, tableName)
    if (missingColumn && Object.prototype.hasOwnProperty.call(nextPayload, missingColumn)) {
      delete nextPayload[missingColumn]
      continue
    }

    throw error
  }
}

function decodeJwtPayload(token) {
  const normalized = asNullableText(token, 5000)
  if (!normalized) return null

  const parts = normalized.split(".")
  if (parts.length < 2) return null

  try {
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = payload + "=".repeat((4 - (payload.length % 4 || 4)) % 4)
    const json = Buffer.from(padded, "base64").toString("utf8")
    return JSON.parse(json)
  } catch {
    return null
  }
}

async function resolveExistingAuthUserId(supabase, candidate) {
  const authUserId = asNullableText(candidate, 120)
  if (!authUserId) return null

  const getter = supabase?.auth?.admin?.getUserById
  if (typeof getter !== "function") {
    return authUserId
  }

  try {
    const { data, error } = await getter.call(supabase.auth.admin, authUserId)
    if (error || !data?.user) return null
    return authUserId
  } catch {
    return null
  }
}

function isMissingAuthUserError(error) {
  const message = error instanceof Error ? error.message : String(error || "")
  return /user not found|not found/i.test(message)
}

function buildMinimalLegacyProfilePayload(payload) {
  return compactObject({
    auth_user_id: payload.auth_user_id,
    full_name: payload.full_name,
    email: payload.email,
    role: payload.role,
    status_cadastro: payload.status_cadastro,
    tipo_documento: payload.tipo_documento,
    documento: payload.documento,
    telefone: payload.telefone,
  })
}

function toLegacyResellerStatus(status) {
  switch (status) {
    case "approved":
      return "aprovado"
    case "rejected":
      return "reprovado"
    case "blocked":
      return "bloqueado"
    case "pending":
      return "pendente"
    default:
      return status
  }
}

function getClientDisplayName({ razaoSocial, fullName }) {
  return razaoSocial || fullName || "Razão social não informada"
}

function derivePaymentStatus(status, current = "pending") {
  switch (status) {
    case "pedido_pago":
    case "pago":
      return "paid"
    case "cancelado":
      return "failed"
    case "aguardando_pagamento":
      return "pending"
    case "aguardando_verificacao_financeira":
      return current || "pending"
    default:
      return current || "pending"
  }
}

function sanitizeOrderItems(items) {
  if (!Array.isArray(items)) return []

  return items
    .map((item) => {
      const quantity = Math.max(1, asInteger(item?.quantity, 1))
      const price = Math.max(0, asNumber(item?.price ?? item?.unit_price ?? 0))
      const subtotal = Number((price * quantity).toFixed(2))
      return {
        id: asNullableText(item?.id, 120) || crypto.randomUUID(),
        name: asNullableText(item?.name, 255) || "Produto",
        category: asNullableText(item?.category, 120),
        reference: asNullableText(item?.reference, 120),
        quantity,
        price,
        subtotal,
      }
    })
    .filter((item) => item.quantity > 0)
}

function sanitizeGiftItems(items) {
  if (!Array.isArray(items)) return []

  return items
    .map((item) => ({
      gift_id: asNullableText(item?.gift_id, 120) || crypto.randomUUID(),
      name: asNullableText(item?.name, 255) || "Brinde",
      quantity: Math.max(1, asInteger(item?.quantity, 1)),
      description: asNullableText(item?.description, 1000),
      reference: asNullableText(item?.reference, 120),
      image_url: asNullableText(item?.image_url, 1000),
      notes: asNullableText(item?.notes, 1000),
    }))
    .filter((item) => item.quantity > 0)
}

function isAdminProfile(profile) {
  return profile?.role === "admin" || profile?.user_type === "admin"
}

function isManagerProfile(profile) {
  return profile?.user_type === "gerente"
}

async function requireBackofficeUser(event, supabase) {
  const authHeader = event.headers.authorization || event.headers.Authorization
  const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : null

  if (!token) {
    throw new Error("unauthorized")
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token)

  if (userError || !user) {
    throw new Error("unauthorized")
  }

  const pickBackofficeProfile = (rows = []) =>
    rows.find((row) => isAdminProfile(row) || isManagerProfile(row)) || rows[0] || null

  let profile = null

  const { data: byAuthProfiles, error: byAuthError } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .limit(10)

  if (!byAuthError) {
    profile = pickBackofficeProfile(byAuthProfiles || [])
  }

  if (!profile && user.email) {
    const { data: exactEmailProfiles, error: exactEmailError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .limit(10)

    if (!exactEmailError) {
      profile = pickBackofficeProfile(exactEmailProfiles || [])
    }
  }

  if (!profile && user.email) {
    const { data: insensitiveEmailProfiles, error: insensitiveEmailError } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", user.email)
      .limit(10)

    if (!insensitiveEmailError) {
      profile = pickBackofficeProfile(insensitiveEmailProfiles || [])
    }
  }

  if (!profile || (!isAdminProfile(profile) && !isManagerProfile(profile))) {
    if (
      user.user_metadata?.user_type === "admin" ||
      user.app_metadata?.role === "admin" ||
      user.user_metadata?.user_type === "gerente"
    ) {
      return {
        user,
        profile: {
          id: profile?.id || user.id,
          auth_user_id: user.id,
          email: user.email,
          role: user.user_metadata?.user_type === "gerente" ? "seller" : "admin",
          user_type: user.user_metadata?.user_type === "gerente" ? "gerente" : "admin",
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email,
        },
      }
    }

    throw new Error("forbidden")
  }

  return { user, profile }
}

async function findManagedResellerProfile(supabase, { resellerId, authUserId, email, managerUserId, managerEmail }) {
  const reseller = await findResellerProfile(supabase, { resellerId, authUserId, email })
  if (!reseller) return null

  const normalizedManagerEmail = asNullableText(managerEmail, 255)?.toLowerCase() || null
  const assignedUserId = asNullableText(reseller.account_manager_user_id, 120)
  const assignedEmail = asNullableText(reseller.account_manager_email, 255)?.toLowerCase() || null

  if (managerUserId && assignedUserId && managerUserId === assignedUserId) {
    return reseller
  }

  if (normalizedManagerEmail && assignedEmail && normalizedManagerEmail === assignedEmail) {
    return reseller
  }

  return null
}

async function resolveAccessScope(supabase, actor) {
  if (isAdminProfile(actor.profile)) {
    return { access: "admin", managerEmail: actor.user.email?.toLowerCase() || null }
  }

  if (isManagerProfile(actor.profile)) {
    return {
      access: "manager",
      managerUserId: actor.user.id,
      managerEmail: actor.user.email?.toLowerCase() || actor.profile.email?.toLowerCase() || null,
    }
  }

  throw new Error("forbidden")
}

async function requireManagedResellerAccess(supabase, body, scope) {
  const resellerId = asNullableText(body.resellerId || body.reseller_id, 120)
  const authUserId = asNullableText(body.userId, 120)
  const email = asNullableText(body.email, 255)

  const reseller =
    scope.access === "admin"
      ? await findResellerProfile(supabase, { resellerId, authUserId, email })
      : await findManagedResellerProfile(supabase, {
          resellerId,
          authUserId,
          email,
          managerUserId: scope.managerUserId,
          managerEmail: scope.managerEmail,
        })

  if (!reseller) {
    throw new Error("reseller_not_found")
  }

  return reseller
}

async function requireManagedOrderAccess(supabase, orderId, scope) {
  const { data: order, error } = await supabase
    .from("orders")
    .select("id, cliente_id, customer_email, payment_status, payment_method")
    .eq("id", orderId)
    .is("deleted_at", null)
    .single()

  if (error || !order) {
    throw new Error("order_not_found")
  }

  if (scope.access === "admin") {
    return order
  }

  const reseller = await findManagedResellerProfile(supabase, {
    resellerId: order.cliente_id,
    authUserId: order.cliente_id,
    email: order.customer_email,
    managerUserId: scope.managerUserId,
    managerEmail: scope.managerEmail,
  })

  if (!reseller) {
    throw new Error("forbidden")
  }

  return order
}

async function findLegacyProfile(supabase, { profileId, authUserId, email }) {
  const candidates = []

  if (profileId) {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", profileId).limit(10)
    if (error) throw error
    candidates.push(...(data || []))
  }

  if (authUserId) {
    const { data, error } = await supabase.from("profiles").select("*").eq("auth_user_id", authUserId).limit(10)
    if (error) throw error
    candidates.push(...(data || []))
  }

  if (email) {
    const { data, error } = await supabase.from("profiles").select("*").ilike("email", email).limit(10)
    if (error) throw error
    candidates.push(...(data || []))
  }

  const byAuth = authUserId ? candidates.find((row) => row?.auth_user_id === authUserId) : null
  if (byAuth) return byAuth

  const byId = profileId ? candidates.find((row) => row?.id === profileId) : null
  if (byId) return byId

  const byEmail = email ? candidates.find((row) => String(row?.email || "").toLowerCase() === String(email).toLowerCase()) : null
  return byEmail || candidates.find((row) => row?.id) || null
}

async function upsertLegacyProfile(supabase, payload) {
  const schema = await loadTableSchema(supabase, "profiles")
  const minimalPayload = adaptLegacyProfilePayload(buildMinimalLegacyProfilePayload(payload), schema)
  const extendedPayload = adaptLegacyProfilePayload(payload, schema)
  const existing = await findLegacyProfile(supabase, {
    profileId: payload.auth_user_id,
    authUserId: payload.auth_user_id,
    email: payload.email,
  })

  if (existing?.id) {
    const nextAuthUserId = payload.auth_user_id ?? existing.auth_user_id ?? null
    const updatePayload = adaptLegacyProfilePayload({
      ...minimalPayload,
      auth_user_id: nextAuthUserId ?? undefined,
    }, schema)

    await updateTableWithRetry(supabase, "profiles", updatePayload, "id", existing.id)

    const bestEffortExtendedPayload = adaptLegacyProfilePayload({
      ...extendedPayload,
      auth_user_id: nextAuthUserId ?? undefined,
    }, schema)

    if (JSON.stringify(bestEffortExtendedPayload) !== JSON.stringify(updatePayload)) {
      try {
        await updateTableWithRetry(supabase, "profiles", bestEffortExtendedPayload, "id", existing.id)
      } catch (extendedError) {
        console.warn("admin-manage legacy profile extended update skipped", normalizeError(extendedError))
      }
    }

    return existing.id
  }

  try {
    const { data } = await insertTableWithRetry(supabase, "profiles", minimalPayload, "id")
    if (JSON.stringify(extendedPayload) !== JSON.stringify(minimalPayload)) {
      try {
        await updateTableWithRetry(supabase, "profiles", extendedPayload, "id", data.id)
      } catch (extendedError) {
        console.warn("admin-manage legacy profile extended insert skipped", normalizeError(extendedError))
      }
    }
    return data.id
  } catch (error) {

    const existingAfterInsert = await findLegacyProfile(supabase, {
      profileId: payload.auth_user_id,
      authUserId: payload.auth_user_id,
      email: payload.email,
    })
    if (existingAfterInsert?.id) {
      try {
        await updateTableWithRetry(supabase, "profiles", minimalPayload, "id", existingAfterInsert.id)
      if (JSON.stringify(extendedPayload) !== JSON.stringify(minimalPayload)) {
          try {
            await updateTableWithRetry(supabase, "profiles", extendedPayload, "id", existingAfterInsert.id)
          } catch (extendedError) {
          console.warn("admin-manage legacy profile extended retry skipped", normalizeError(extendedError))
        }
      }
      return existingAfterInsert.id
      } catch (retryUpdateError) {
        throw retryUpdateError
      }
    }

    throw error
  }
}

async function findResellerProfile(supabase, { resellerId, authUserId, email }) {
  if (resellerId) {
    const { data, error } = await supabase.from("reseller_profiles").select("*").eq("id", resellerId).limit(5)
    if (error) throw error
    if (data?.[0]) return data[0]
  }

  if (authUserId) {
    const { data, error } = await supabase
      .from("reseller_profiles")
      .select("*")
      .eq("user_id", authUserId)
      .limit(5)

    if (error) throw error
    if (data?.[0]) return data[0]
  }

  if (resellerId) {
    const { data, error } = await supabase
      .from("reseller_profiles")
      .select("*")
      .eq("user_id", resellerId)
      .limit(5)

    if (error) throw error
    if (data?.[0]) return data[0]
  }

  if (email) {
    const { data, error } = await supabase
      .from("reseller_profiles")
      .select("*")
      .eq("email", email)
      .limit(5)

    if (error) throw error
    if (data?.[0]) return data[0]
  }

  return null
}

async function updateResellerProfileWithFallback(supabase, resellerId, payload) {
  const schema = await loadTableSchema(supabase, "reseller_profiles")
  const primaryPayload = filterPayloadToSchema(payload, schema)
  const { error } = await supabase.from("reseller_profiles").update(primaryPayload).eq("id", resellerId)
  if (!error) return

  const fallbackPayload = compactObject({
    ...primaryPayload,
    status_cadastro: toLegacyResellerStatus(primaryPayload.status_cadastro),
  })

  await updateTableWithRetry(supabase, "reseller_profiles", fallbackPayload, "id", resellerId)
}

async function clearManagerAssignments(supabase, { authUserId, email }) {
  const normalizedEmail = asNullableText(email, 255)?.toLowerCase() || null
  const now = new Date().toISOString()

  const profileSchema = await loadTableSchema(supabase, "profiles")
  const resellerSchema = await loadTableSchema(supabase, "reseller_profiles")

  const profilePayload = filterPayloadToSchema(
    {
      account_manager_user_id: null,
      account_manager_name: null,
      account_manager_email: null,
      account_manager_whatsapp: null,
      updated_at: now,
    },
    profileSchema
  )

  const resellerPayload = filterPayloadToSchema(
    {
      account_manager_user_id: null,
      account_manager_name: null,
      account_manager_email: null,
      account_manager_whatsapp: null,
      updated_at: now,
    },
    resellerSchema
  )

  if (authUserId && hasColumn(profileSchema, "account_manager_user_id") && Object.keys(profilePayload).length > 0) {
    const { error } = await supabase.from("profiles").update(profilePayload).eq("account_manager_user_id", authUserId)
    if (error) throw error
  }

  if (normalizedEmail && hasColumn(profileSchema, "account_manager_email") && Object.keys(profilePayload).length > 0) {
    const { error } = await supabase.from("profiles").update(profilePayload).ilike("account_manager_email", normalizedEmail)
    if (error) throw error
  }

  if (authUserId && hasColumn(resellerSchema, "account_manager_user_id") && Object.keys(resellerPayload).length > 0) {
    const { error } = await supabase.from("reseller_profiles").update(resellerPayload).eq("account_manager_user_id", authUserId)
    if (error) throw error
  }

  if (normalizedEmail && hasColumn(resellerSchema, "account_manager_email") && Object.keys(resellerPayload).length > 0) {
    const { error } = await supabase.from("reseller_profiles").update(resellerPayload).ilike("account_manager_email", normalizedEmail)
    if (error) throw error
  }
}

async function deleteLegacyProfiles(supabase, { profileId, authUserId, email }) {
  if (profileId) {
    const { error } = await supabase.from("profiles").delete().eq("id", profileId)
    if (error) throw error
  }

  if (authUserId) {
    const { error } = await supabase.from("profiles").delete().eq("auth_user_id", authUserId)
    if (error) throw error
  }

  if (email) {
    const { error } = await supabase.from("profiles").delete().ilike("email", email)
    if (error) throw error
  }
}

async function deleteResellerProfiles(supabase, { resellerId, authUserId, email }) {
  if (resellerId) {
    const { error } = await supabase.from("reseller_profiles").delete().eq("id", resellerId)
    if (error) throw error
  }

  if (authUserId) {
    const { error } = await supabase.from("reseller_profiles").delete().eq("user_id", authUserId)
    if (error) throw error
  }

  if (email) {
    const { error } = await supabase.from("reseller_profiles").delete().ilike("email", email)
    if (error) throw error
  }
}

async function handleDeleteUser(supabase, body, adminUserId) {
  const targetId = asText(body.userId, 120)
  const resellerId = asNullableText(body.reseller_id || body.resellerId, 120)
  const email = asNullableText(body.email, 255)?.toLowerCase() || null

  const loadedProfile = await findLegacyProfile(supabase, {
    profileId: targetId,
    authUserId: targetId,
    email,
  })
  const resellerProfile = await findResellerProfile(supabase, {
    resellerId: resellerId || targetId,
    authUserId: targetId,
    email,
  })

  if (!loadedProfile && !resellerProfile) {
    throw new Error("user_not_found")
  }

  const authUserId = await resolveExistingAuthUserId(
    supabase,
    loadedProfile?.auth_user_id || resellerProfile?.user_id || null
  )

  if (authUserId && authUserId === adminUserId) {
    throw new Error("self_delete_forbidden")
  }

  const targetUserType =
    asNullableText(body.user_type, 32) ||
    loadedProfile?.user_type ||
    loadedProfile?.role ||
    (resellerProfile ? "cliente" : null)

  const profileEmail = email || loadedProfile?.email?.toLowerCase() || resellerProfile?.email?.toLowerCase() || null

  if (targetUserType === "gerente") {
    await clearManagerAssignments(supabase, {
      authUserId,
      email: profileEmail,
    })
  }

  if (authUserId) {
    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(authUserId)
    if (authDeleteError && !isMissingAuthUserError(authDeleteError)) {
      throw authDeleteError
    }
  }

  await deleteResellerProfiles(supabase, {
    resellerId: resellerProfile?.id || resellerId,
    authUserId,
    email: profileEmail,
  })

  await deleteLegacyProfiles(supabase, {
    profileId: loadedProfile?.id || targetId,
    authUserId,
    email: profileEmail,
  })

  return {
    id: authUserId || loadedProfile?.id || resellerProfile?.id || targetId || resellerId,
  }
}

async function handleUpdateOrder(supabase, body, actorUserId, scope) {
  const orderId = asText(body.orderId, 120)
  if (!orderId) throw new Error("order_id_required")

  if (scope.access === "manager") {
    await requireManagedOrderAccess(supabase, orderId, scope)
  }

  const { data: currentOrder, error: currentError } = await supabase
    .from("orders")
    .select("id, payment_status, payment_method")
    .eq("id", orderId)
    .is("deleted_at", null)
    .single()

  if (currentError || !currentOrder) throw new Error("order_not_found")

  const items = sanitizeOrderItems(body.items)
  const giftItems = sanitizeGiftItems(body.gift_items)
  const subtotal = Number(items.reduce((sum, item) => sum + asNumber(item.subtotal), 0).toFixed(2))
  const paymentMethod = asNullableText(body.payment_method, 32) || currentOrder.payment_method || null
  const automaticPricing = calculateAutomaticOrderPricing(subtotal, paymentMethod)
  const requestedAutomaticDiscount =
    body.automatic_discount_amount === undefined || body.automatic_discount_amount === null || body.automatic_discount_amount === ""
      ? automaticPricing.automaticDiscount
      : asNumber(body.automatic_discount_amount)
  const automaticDiscountAmount = Number(
    Math.min(subtotal, Math.max(0, requestedAutomaticDiscount)).toFixed(2)
  )

  const discountType = asNullableText(body.admin_discount_type, 20)
  const discountValue = Math.max(0, asNumber(body.admin_discount_value))
  const discountAmount = Number(Math.max(0, asNumber(body.admin_discount_amount)).toFixed(2))

  const bonusType = asNullableText(body.admin_bonus_type, 20)
  const bonusValue = Math.max(0, asNumber(body.admin_bonus_value))
  const bonusAmount = Number(Math.max(0, asNumber(body.admin_bonus_amount)).toFixed(2))
  const total = Number(Math.max(0, subtotal - automaticDiscountAmount - discountAmount - bonusAmount).toFixed(2))

  const status = asText(body.status, 64) || "aguardando_aprovacao"
  const payload = {
    items,
    subtotal,
    original_total: subtotal,
    automatic_discount_amount: automaticDiscountAmount,
    total,
    status: toDatabaseOrderStatus(status),
    payment_status: body.payment_status || derivePaymentStatus(status, currentOrder.payment_status),
    payment_method: paymentMethod,
    invoice_number: asNullableText(body.invoice_number, 120),
    tracking_code: asNullableText(body.tracking_code, 160),
    payment_instructions: asNullableText(body.payment_instructions, 4000),
    payment_copy_paste: asNullableText(body.payment_copy_paste, 4000),
    payment_link_url: asNullableText(body.payment_link_url, 1000),
    payment_boleto_line: asNullableText(body.payment_boleto_line, 1000),
    payment_boleto_pdf_url: asNullableText(body.payment_boleto_pdf_url, 1000),
    payment_pix_bank_name: asNullableText(body.payment_pix_bank_name, 255),
    payment_pix_key: asNullableText(body.payment_pix_key, 255),
    payment_pix_beneficiary: asNullableText(body.payment_pix_beneficiary, 255),
    payment_pix_agency: asNullableText(body.payment_pix_agency, 120),
    payment_pix_account: asNullableText(body.payment_pix_account, 120),
    payment_pix_amount: asNullableText(body.payment_pix_amount, 120),
    payment_pix_qr_code: asNullableText(body.payment_pix_qr_code, 4000),
    admin_discount_type: discountType,
    admin_discount_value: discountValue || null,
    admin_discount_amount: discountAmount || null,
    admin_bonus_type: bonusType,
    admin_bonus_value: bonusValue || null,
    admin_bonus_amount: bonusAmount || null,
    admin_bonus_product_id: asNullableText(body.admin_bonus_product_id, 120),
    admin_bonus_product_name: asNullableText(body.admin_bonus_product_name, 255),
    admin_bonus_quantity: bonusType === "item" ? Math.max(1, asInteger(body.admin_bonus_quantity, 1)) : null,
    gift_items: giftItems,
    updated_by_admin_id: actorUserId,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase.from("orders").update(payload).eq("id", orderId).select("*").single()
  if (error) throw error
  return data
}

async function handleDeleteOrder(supabase, body, adminUserId) {
  const orderId = asText(body.orderId, 120)
  if (!orderId) throw new Error("order_id_required")

  const payload = {
    deleted_at: new Date().toISOString(),
    updated_by_admin_id: adminUserId,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("orders").update(payload).eq("id", orderId)
  if (error) throw error
  return { id: orderId }
}

async function handleCreateScopedOrder(supabase, body, actor, scope) {
  const reseller = await requireManagedResellerAccess(supabase, body, scope)
  const items = sanitizeOrderItems(body.items)

  if (!items.length) {
    throw new Error("order_items_required")
  }

  const subtotal = Number(items.reduce((sum, item) => sum + asNumber(item.subtotal), 0).toFixed(2))
  const paymentMethod = asNullableText(body.payment_method, 32) || "pix"
  const automaticPricing = calculateAutomaticOrderPricing(subtotal, paymentMethod)
  const requestedAutomaticDiscount =
    body.automatic_discount_amount === undefined || body.automatic_discount_amount === null || body.automatic_discount_amount === ""
      ? automaticPricing.automaticDiscount
      : asNumber(body.automatic_discount_amount)
  const automaticDiscountAmount = Number(
    Math.min(subtotal, Math.max(0, requestedAutomaticDiscount)).toFixed(2)
  )
  const total = Number(Math.max(0, subtotal - automaticDiscountAmount).toFixed(2))
  const orderSchema = await loadTableSchema(supabase, "orders")

  const payload = filterPayloadToSchema(
    {
      cliente_id: reseller.id || reseller.user_id || null,
      customer_name: reseller.razao_social || reseller.nome_responsavel || "Cliente",
      customer_email: reseller.email || null,
      customer_phone: reseller.whatsapp || reseller.telefone || null,
      customer_cpf: reseller.cnpj || null,
      shipping_street: reseller.endereco || null,
      shipping_number: reseller.numero || null,
      shipping_complement: reseller.complemento || null,
      shipping_neighborhood: reseller.bairro || null,
      shipping_city: reseller.cidade || null,
      shipping_state: reseller.estado || null,
      shipping_postal_code: reseller.cep || null,
      items,
      subtotal,
      original_total: subtotal,
      automatic_discount_amount: automaticDiscountAmount,
      shipping_cost: 0,
      total,
      payment_method: paymentMethod,
      payment_status: "pending",
      shipping_method: "free",
      status: "novo_pedido",
      seller_id: actor.user.id,
      updated_at: new Date().toISOString(),
    },
    orderSchema
  )

  const { data, error } = await supabase.from("orders").insert(payload).select("*").single()
  if (error) throw error
  return data
}

async function handleApproveReseller(supabase, body) {
  const resellerId = asText(body.resellerId, 120)
  const authUserId = asNullableText(body.userId, 120)
  const email = asNullableText(body.email, 255)
  const managerUserId = asNullableText(body.managerUserId, 120)
  const managerName = asNullableText(body.managerName, 255)
  const managerEmail = asNullableText(body.managerEmail, 255)?.toLowerCase() || null
  const managerWhatsapp = asNullableText(body.managerWhatsapp, 64)
  if (!resellerId) throw new Error("reseller_id_required")

  console.info("admin-manage approve-reseller:start", {
    resellerId,
    authUserId,
    hasEmail: Boolean(email),
    managerName,
  })

  const reseller = await findResellerProfile(supabase, {
    resellerId,
    authUserId: authUserId || resellerId,
    email,
  })

  if (!reseller) throw new Error("reseller_not_found")

  const now = new Date().toISOString()
  try {
    await updateResellerProfileWithFallback(supabase, reseller.id, {
      status_cadastro: "approved",
      motivo_reprovacao: null,
      account_manager_user_id: managerUserId,
      account_manager_name: managerName,
      account_manager_email: managerEmail,
      account_manager_whatsapp: managerWhatsapp,
      referred_by_manager_user_id: reseller.referred_by_manager_user_id || null,
      referred_by_manager_name: reseller.referred_by_manager_name || null,
      referred_by_manager_email: reseller.referred_by_manager_email || null,
      referred_by_manager_whatsapp: reseller.referred_by_manager_whatsapp || null,
      referral_code_used: reseller.referral_code_used || null,
      signup_origin: reseller.signup_origin || null,
      updated_at: now,
    })
  } catch (error) {
    const normalized = normalizeError(error)
    throw new Error(`reseller_update_failed: ${normalized.message}`)
  }

  const safeAuthUserId = await resolveExistingAuthUserId(supabase, reseller.user_id)

  try {
    await upsertLegacyProfile(supabase, {
      auth_user_id: safeAuthUserId,
      full_name: getClientDisplayName({ razaoSocial: reseller.razao_social, fullName: reseller.nome_responsavel }),
      email: reseller.email,
      role: "client",
      user_type: "cliente",
      company_name: reseller.razao_social,
      status_cadastro: "aprovado",
      tipo_documento: "cnpj",
      documento: reseller.cnpj,
      telefone: reseller.whatsapp || reseller.telefone,
      endereco: buildAddressPayload(reseller),
      motivo_reprovacao: null,
      account_manager_user_id: managerUserId,
      account_manager_name: managerName,
      account_manager_email: managerEmail,
      account_manager_whatsapp: managerWhatsapp,
      updated_at: now,
    })
  } catch (error) {
    const normalized = normalizeError(error)
    throw new Error(`legacy_profile_sync_failed: ${normalized.message}`)
  }

  return { id: reseller.id }
}

async function handleRejectReseller(supabase, body) {
  const resellerId = asText(body.resellerId, 120)
  const authUserId = asNullableText(body.userId, 120)
  const email = asNullableText(body.email, 255)
  const reason = asText(body.reason, 1000) || "Cadastro reprovado pela equipe comercial."
  if (!resellerId) throw new Error("reseller_id_required")

  console.info("admin-manage reject-reseller:start", {
    resellerId,
    authUserId,
    hasEmail: Boolean(email),
  })

  const reseller = await findResellerProfile(supabase, {
    resellerId,
    authUserId: authUserId || resellerId,
    email,
  })

  if (!reseller) throw new Error("reseller_not_found")

  const now = new Date().toISOString()
  try {
    await updateResellerProfileWithFallback(supabase, reseller.id, {
      status_cadastro: "rejected",
      motivo_reprovacao: reason,
      account_manager_user_id: null,
      account_manager_email: null,
      referred_by_manager_user_id: reseller.referred_by_manager_user_id || null,
      referred_by_manager_name: reseller.referred_by_manager_name || null,
      referred_by_manager_email: reseller.referred_by_manager_email || null,
      referred_by_manager_whatsapp: reseller.referred_by_manager_whatsapp || null,
      referral_code_used: reseller.referral_code_used || null,
      signup_origin: reseller.signup_origin || null,
      updated_at: now,
    })
  } catch (error) {
    const normalized = normalizeError(error)
    throw new Error(`reseller_update_failed: ${normalized.message}`)
  }

  const safeAuthUserId = await resolveExistingAuthUserId(supabase, reseller.user_id)

  try {
    await upsertLegacyProfile(supabase, {
      auth_user_id: safeAuthUserId,
      full_name: getClientDisplayName({ razaoSocial: reseller.razao_social, fullName: reseller.nome_responsavel }),
      email: reseller.email,
      role: "client",
      user_type: "cliente",
      company_name: reseller.razao_social,
      status_cadastro: "reprovado",
      tipo_documento: "cnpj",
      documento: reseller.cnpj,
      telefone: reseller.whatsapp || reseller.telefone,
      endereco: buildAddressPayload(reseller),
      motivo_reprovacao: reason,
      account_manager_user_id: null,
      account_manager_email: null,
      referred_by_manager_user_id: reseller.referred_by_manager_user_id || null,
      referred_by_manager_name: reseller.referred_by_manager_name || null,
      referred_by_manager_email: reseller.referred_by_manager_email || null,
      referred_by_manager_whatsapp: reseller.referred_by_manager_whatsapp || null,
      referral_code_used: reseller.referral_code_used || null,
      signup_origin: reseller.signup_origin || null,
      updated_at: now,
    })
  } catch (error) {
    const normalized = normalizeError(error)
    throw new Error(`legacy_profile_sync_failed: ${normalized.message}`)
  }

  return { id: reseller.id }
}

async function handleUpdateClient(supabase, body, scope) {
  const resellerId = asText(body.resellerId, 120)
  if (!resellerId) throw new Error("reseller_id_required")
  const newPassword = asNullableText(body.password, 255)
  if (newPassword && newPassword.length < 6) throw new Error("password_too_short")

  const reseller = await requireManagedResellerAccess(supabase, body, scope)
  const isManagerScope = scope?.access === "manager"

  const statusMap = normalizeApprovalStatus(body.status_cadastro)
  const now = new Date().toISOString()
  const safeAuthUserId = await resolveExistingAuthUserId(supabase, reseller.user_id)
  const normalizedEmail = asNullableText(body.email, 255)?.toLowerCase() || reseller.email
  const normalizedCnpj = asNullableText(body.cnpj, 32) || reseller.cnpj
  const normalizedRazaoSocial = asNullableText(body.razao_social, 255) || reseller.razao_social
  const normalizedResponsavel = asNullableText(body.nome_responsavel, 255) || reseller.nome_responsavel
  const normalizedPhone = asNullableText(body.telefone, 64) || reseller.telefone
  const managerUserId = isManagerScope ? reseller.account_manager_user_id || null : asNullableText(body.account_manager_user_id, 120) || reseller.account_manager_user_id || null
  const managerName = isManagerScope ? reseller.account_manager_name || null : asNullableText(body.account_manager_name, 255) || reseller.account_manager_name || null
  const managerEmail = isManagerScope
    ? reseller.account_manager_email || null
    : asNullableText(body.account_manager_email, 255)?.toLowerCase() || reseller.account_manager_email || null
  const managerWhatsapp = isManagerScope ? reseller.account_manager_whatsapp || null : asNullableText(body.account_manager_whatsapp, 64) || reseller.account_manager_whatsapp || null

  if (newPassword && !safeAuthUserId) {
    throw new Error("password_update_requires_auth_user")
  }

  if (isManagerScope && newPassword) {
    throw new Error("forbidden")
  }

  if (safeAuthUserId) {
    const authUpdatePayload = {
      email: normalizedEmail,
      ...(!isManagerScope && newPassword ? { password: newPassword } : {}),
      user_metadata: {
        full_name: getClientDisplayName({
          razaoSocial: normalizedRazaoSocial,
          fullName: normalizedResponsavel,
        }),
        telefone: normalizedPhone,
        documento: normalizedCnpj,
        cnpj: normalizedCnpj,
        tipo_documento: "cnpj",
        user_type: asNullableText(body.user_type, 32) || "cliente",
        company_name: normalizedRazaoSocial,
      },
    }

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(safeAuthUserId, authUpdatePayload)

    if (authUpdateError && !isMissingAuthUserError(authUpdateError)) {
      throw authUpdateError
    }
  }

  const resellerPayload = {
    razao_social: normalizedRazaoSocial,
    nome_fantasia: asNullableText(body.nome_fantasia, 255),
    cnpj: normalizedCnpj,
    nome_responsavel: normalizedResponsavel,
    email: normalizedEmail,
    telefone: normalizedPhone,
    whatsapp: asNullableText(body.whatsapp, 64),
    endereco: asNullableText(body.endereco, 255) || reseller.endereco,
    numero: asNullableText(body.numero, 32) || reseller.numero,
    complemento: asNullableText(body.complemento, 120),
    bairro: asNullableText(body.bairro, 120) || reseller.bairro,
    cidade: asNullableText(body.cidade, 120) || reseller.cidade,
    estado: asNullableText(body.estado, 80) || reseller.estado,
    cep: asNullableText(body.cep, 32) || reseller.cep,
    observacoes: asNullableText(body.observacoes, 2000),
    status_cadastro: isManagerScope ? reseller.status_cadastro : statusMap.reseller,
    motivo_reprovacao: isManagerScope ? reseller.motivo_reprovacao || null : asNullableText(body.motivo_reprovacao, 1000),
    account_manager_user_id: managerUserId,
    account_manager_name: managerName,
    account_manager_email: managerEmail,
    account_manager_whatsapp: managerWhatsapp,
    updated_at: now,
  }

  await updateResellerProfileWithFallback(supabase, resellerId, resellerPayload)

  await upsertLegacyProfile(supabase, {
    auth_user_id: safeAuthUserId,
    full_name: getClientDisplayName({
      razaoSocial: resellerPayload.razao_social,
      fullName: resellerPayload.nome_responsavel,
    }),
    email: resellerPayload.email,
    role: "client",
    user_type: asNullableText(body.user_type, 32) || "cliente",
    company_name: resellerPayload.razao_social,
    status_cadastro: isManagerScope ? normalizeApprovalStatus(reseller.status_cadastro).profile : statusMap.profile,
    tipo_documento: "cnpj",
    documento: resellerPayload.cnpj,
    telefone: resellerPayload.whatsapp || resellerPayload.telefone,
    endereco: buildAddressPayload(resellerPayload),
    motivo_reprovacao: resellerPayload.motivo_reprovacao,
    notes: isManagerScope ? undefined : asNullableText(body.notes, 2000),
    account_manager_user_id: managerUserId,
    account_manager_name: managerName,
    account_manager_email: managerEmail,
    account_manager_whatsapp: managerWhatsapp,
    referred_by_manager_user_id: reseller.referred_by_manager_user_id || null,
    referred_by_manager_name: reseller.referred_by_manager_name || null,
    referred_by_manager_email: reseller.referred_by_manager_email || null,
    referred_by_manager_whatsapp: reseller.referred_by_manager_whatsapp || null,
    referral_code_used: reseller.referral_code_used || null,
    signup_origin: reseller.signup_origin || null,
    updated_at: now,
  })

  return { id: resellerId }
}

async function handleCreateUser(supabase, body) {
  const fullName = asText(body.full_name, 255)
  const email = asText(body.email, 255)?.toLowerCase()
  const password = asText(body.password, 255)
  const phone = asNullableText(body.telefone, 64)
  const documento = asNullableText(body.documento, 64)
  const tipoDocumento = asNullableText(body.tipo_documento, 16)
  const notes = asNullableText(body.notes, 2000)
  const statusMap = normalizeApprovalStatus(body.status_cadastro)
  const { role, userType } = mapUserType(body.user_type)
  const razaoSocial = asNullableText(body.razao_social, 255)
  const nomeFantasia = asNullableText(body.nome_fantasia, 255)
  const segmento = asNullableText(body.segmento, 120)
  const faixaInvestimento = asNullableText(body.faixa_investimento, 120)
  const canalRevenda = asNullableText(body.canal_revenda, 120)
  const cep = asNullableText(body.cep, 32)
  const endereco = asNullableText(body.endereco, 255)
  const numero = asNullableText(body.numero, 32)
  const complemento = asNullableText(body.complemento, 120)
  const bairro = asNullableText(body.bairro, 120)
  const cidade = asNullableText(body.cidade, 120)
  const estado = asNullableText(body.estado, 80)
  const companyName = asNullableText(body.company_name, 255)
  const managerUserId = asNullableText(body.account_manager_user_id, 120)
  const managerName = asNullableText(body.account_manager_name, 255)
  const managerEmail = asNullableText(body.account_manager_email, 255)?.toLowerCase() || null
  const managerWhatsapp = asNullableText(body.account_manager_whatsapp, 64)
  const visualName = role === "client" ? getClientDisplayName({ razaoSocial: razaoSocial, fullName }) : fullName

  if (!fullName || !email || !password) {
    throw new Error("required_fields_missing")
  }

  if (
    role === "client" &&
    (!documento ||
      tipoDocumento !== "cnpj" ||
      !razaoSocial ||
      !segmento ||
      !faixaInvestimento ||
      !canalRevenda ||
      !phone ||
      !cep ||
      !endereco ||
      !numero ||
      !bairro ||
      !cidade ||
      !estado)
  ) {
    throw new Error("required_client_fields_missing")
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: visualName,
      telefone: phone,
      documento,
      tipo_documento: tipoDocumento,
      user_type: userType,
      company_name: role === "client" ? razaoSocial : companyName,
    },
  })

  if (createError || !created.user) throw createError || new Error("user_create_failed")

  const now = new Date().toISOString()
  try {
    await upsertLegacyProfile(supabase, {
      auth_user_id: created.user.id,
      full_name: visualName,
      email,
      role,
      user_type: userType,
      company_name: role === "client" ? razaoSocial : companyName,
      status_cadastro: statusMap.profile,
      tipo_documento: tipoDocumento,
      documento,
      telefone: phone,
      notes,
      account_manager_user_id: role === "client" ? managerUserId : null,
      account_manager_name: role === "client" ? managerName : null,
      account_manager_email: role === "client" ? managerEmail : null,
      account_manager_whatsapp: role === "client" ? managerWhatsapp : null,
      signup_origin: role === "client" ? "cadastro_admin" : null,
      updated_at: now,
    })

    if (role === "client") {
      const resellerSchema = await loadTableSchema(supabase, "reseller_profiles")
      const { error: resellerError } = await supabase.from("reseller_profiles").insert(filterPayloadToSchema({
        user_id: created.user.id,
        cnpj: documento,
        razao_social: razaoSocial,
        nome_fantasia: nomeFantasia,
        segmento,
        nome_responsavel: fullName,
        telefone: phone,
        whatsapp: phone,
        email,
        cep,
        endereco,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        canal_revenda: canalRevenda,
        faixa_investimento: faixaInvestimento,
        status_cadastro: statusMap.reseller,
        account_manager_user_id: managerUserId,
        account_manager_name: managerName,
        account_manager_email: managerEmail,
        account_manager_whatsapp: managerWhatsapp,
        signup_origin: "cadastro_admin",
      }, resellerSchema))

      if (resellerError) throw resellerError
    }
  } catch (error) {
    await supabase.auth.admin.deleteUser(created.user.id)
    throw error
  }

  return { id: created.user.id, email, role, user_type: userType }
}

async function handleUpdateUser(supabase, body) {
  const targetId = asText(body.userId, 120)
  if (!targetId) throw new Error("user_id_required")
  const newPassword = asNullableText(body.password, 255)
  if (newPassword && newPassword.length < 6) throw new Error("password_too_short")

  const loadedProfile = await findLegacyProfile(supabase, {
    profileId: targetId,
    authUserId: targetId,
    email: asNullableText(body.email, 255),
  })
  const resellerProfile = await findResellerProfile(supabase, {
    resellerId: body.reseller_id || targetId,
    authUserId: targetId,
    email: asNullableText(body.email, 255),
  })

  let existingProfile = loadedProfile
  if (!existingProfile && resellerProfile) {
    existingProfile = {
      id: resellerProfile.user_id || resellerProfile.id,
      auth_user_id: resellerProfile.user_id,
      full_name: resellerProfile.nome_responsavel || resellerProfile.razao_social,
      email: resellerProfile.email,
      role: "client",
      user_type: "cliente",
      company_name: resellerProfile.razao_social,
      status_cadastro: normalizeApprovalStatus(resellerProfile.status_cadastro).profile,
      tipo_documento: "cnpj",
      documento: resellerProfile.cnpj,
      telefone: resellerProfile.whatsapp || resellerProfile.telefone,
      endereco: buildAddressPayload(resellerProfile),
      motivo_reprovacao: resellerProfile.motivo_reprovacao || null,
      referred_by_manager_user_id: resellerProfile.referred_by_manager_user_id || null,
      referred_by_manager_name: resellerProfile.referred_by_manager_name || null,
      referred_by_manager_email: resellerProfile.referred_by_manager_email || null,
      referred_by_manager_whatsapp: resellerProfile.referred_by_manager_whatsapp || null,
      referral_code_used: resellerProfile.referral_code_used || null,
      signup_origin: resellerProfile.signup_origin || null,
      account_manager_name: resellerProfile.account_manager_name || null,
      account_manager_whatsapp: resellerProfile.account_manager_whatsapp || null,
      notes: null,
    }
  }

  if (!existingProfile) throw new Error("user_not_found")

  const authUserId = await resolveExistingAuthUserId(
    supabase,
    existingProfile.auth_user_id || resellerProfile?.user_id || null
  )
  if (newPassword && !authUserId) {
    throw new Error("password_update_requires_auth_user")
  }
  const targetType = asNullableText(body.user_type, 32) || existingProfile.user_type || existingProfile.role || "vendedor"
  const { role, userType } = mapUserType(targetType)
  const statusMap = normalizeApprovalStatus(body.status_cadastro || existingProfile.status_cadastro)
  const notes = asNullableText(body.notes, 2000)
  const companyName = asNullableText(body.company_name, 255)
  const phone = asNullableText(body.telefone, 64)
  const documento = asNullableText(body.documento, 64)
  const tipoDocumento = asNullableText(body.tipo_documento, 16)
  const razaoSocial = asNullableText(body.razao_social, 255)
  const nomeFantasia = asNullableText(body.nome_fantasia, 255)
  const segmento = asNullableText(body.segmento, 120)
  const faixaInvestimento = asNullableText(body.faixa_investimento, 120)
  const canalRevenda = asNullableText(body.canal_revenda, 120)
  const cep = asNullableText(body.cep, 32)
  const endereco = asNullableText(body.endereco, 255)
  const numero = asNullableText(body.numero, 32)
  const complemento = asNullableText(body.complemento, 120)
  const bairro = asNullableText(body.bairro, 120)
  const cidade = asNullableText(body.cidade, 120)
  const estado = asNullableText(body.estado, 80)
  const nomeResponsavel = asNullableText(body.nome_responsavel, 255)
  const email = asNullableText(body.email, 255)?.toLowerCase()

  const existingReseller =
    resellerProfile ||
    (await findResellerProfile(supabase, {
      resellerId: body.reseller_id,
      authUserId,
      email: existingProfile.email,
    }))
  const managerUserId = asNullableText(body.account_manager_user_id, 120) || existingProfile.account_manager_user_id || existingReseller?.account_manager_user_id || null
  const managerName = asNullableText(body.account_manager_name, 255) || existingProfile.account_manager_name || existingReseller?.account_manager_name || null
  const managerEmail = asNullableText(body.account_manager_email, 255)?.toLowerCase() || existingProfile.account_manager_email || existingReseller?.account_manager_email || null
  const managerWhatsapp = asNullableText(body.account_manager_whatsapp, 64) || existingProfile.account_manager_whatsapp || existingReseller?.account_manager_whatsapp || null

  const finalRazaoSocial = role === "client"
    ? razaoSocial || existingReseller?.razao_social || existingProfile.company_name || existingProfile.full_name
    : null

  const finalFullName = role === "client"
    ? getClientDisplayName({
        razaoSocial: finalRazaoSocial,
        fullName: nomeResponsavel || existingReseller?.nome_responsavel || existingProfile.full_name,
      })
    : asNullableText(body.full_name, 255) || existingProfile.full_name

  if (!email || !finalFullName) {
    throw new Error("required_fields_missing")
  }

  if (
    role === "client" &&
    (!documento ||
      (tipoDocumento && tipoDocumento !== "cnpj") ||
      !finalRazaoSocial ||
      !(segmento || existingReseller?.segmento) ||
      !(faixaInvestimento || existingReseller?.faixa_investimento) ||
      !(canalRevenda || existingReseller?.canal_revenda) ||
      !(phone || existingReseller?.telefone || existingProfile.telefone) ||
      !(cep || existingReseller?.cep) ||
      !(endereco || existingReseller?.endereco) ||
      !(numero || existingReseller?.numero) ||
      !(bairro || existingReseller?.bairro) ||
      !(cidade || existingReseller?.cidade) ||
      !(estado || existingReseller?.estado))
  ) {
    throw new Error("required_client_fields_missing")
  }

  if (authUserId) {
    const authUpdatePayload = {
      email,
      ...(newPassword ? { password: newPassword } : {}),
      user_metadata: {
        full_name: finalFullName,
        telefone: phone || existingReseller?.telefone || existingProfile.telefone || null,
        documento: documento || existingReseller?.cnpj || existingProfile.documento || null,
        tipo_documento: role === "client" ? "cnpj" : tipoDocumento || existingProfile.tipo_documento || null,
        user_type: userType,
        company_name: role === "client" ? finalRazaoSocial : companyName || existingProfile.company_name || null,
      },
    }

    const { error: authUpdateError } = await supabase.auth.admin.updateUserById(authUserId, authUpdatePayload)

    if (authUpdateError && !isMissingAuthUserError(authUpdateError)) throw authUpdateError
  }

  const now = new Date().toISOString()
  await upsertLegacyProfile(supabase, {
    auth_user_id: authUserId ?? existingProfile.auth_user_id ?? existingReseller?.user_id ?? undefined,
    full_name: finalFullName,
    email,
    role,
    user_type: userType,
    company_name: role === "client" ? finalRazaoSocial : companyName,
    status_cadastro: statusMap.profile,
    tipo_documento: role === "client" ? "cnpj" : tipoDocumento || existingProfile.tipo_documento,
    documento: documento || existingReseller?.cnpj || existingProfile.documento || null,
    telefone: phone || existingReseller?.whatsapp || existingReseller?.telefone || existingProfile.telefone || null,
    endereco: buildAddressPayload({
      cep: cep || existingReseller?.cep || existingProfile.endereco?.cep,
      endereco: endereco || existingReseller?.endereco || existingProfile.endereco?.endereco,
      numero: numero || existingReseller?.numero || existingProfile.endereco?.numero,
      complemento: complemento || existingReseller?.complemento || existingProfile.endereco?.complemento,
      bairro: bairro || existingReseller?.bairro || existingProfile.endereco?.bairro,
      cidade: cidade || existingReseller?.cidade || existingProfile.endereco?.cidade,
      estado: estado || existingReseller?.estado || existingProfile.endereco?.estado,
    }),
    motivo_reprovacao: asNullableText(body.motivo_reprovacao, 1000),
    notes,
    account_manager_user_id: managerUserId,
    account_manager_name: managerName,
    account_manager_email: managerEmail,
    account_manager_whatsapp: managerWhatsapp,
    referred_by_manager_user_id: existingReseller?.referred_by_manager_user_id || existingProfile.referred_by_manager_user_id || null,
    referred_by_manager_name: existingReseller?.referred_by_manager_name || existingProfile.referred_by_manager_name || null,
    referred_by_manager_email: existingReseller?.referred_by_manager_email || existingProfile.referred_by_manager_email || null,
    referred_by_manager_whatsapp: existingReseller?.referred_by_manager_whatsapp || existingProfile.referred_by_manager_whatsapp || null,
    referral_code_used: existingReseller?.referral_code_used || existingProfile.referral_code_used || null,
    signup_origin: existingReseller?.signup_origin || existingProfile.signup_origin || (role === "client" ? "cadastro_admin" : null),
    updated_at: now,
  })

  if (role === "client") {
    const resellerPayload = {
      user_id: authUserId,
      cnpj: documento || existingReseller?.cnpj,
      razao_social: finalRazaoSocial,
      nome_fantasia: nomeFantasia || existingReseller?.nome_fantasia || null,
      segmento: segmento || existingReseller?.segmento,
      nome_responsavel: nomeResponsavel || existingReseller?.nome_responsavel || finalFullName,
      telefone: phone || existingReseller?.telefone || existingProfile.telefone,
      whatsapp: asNullableText(body.whatsapp, 64) || existingReseller?.whatsapp || phone || existingProfile.telefone || null,
      email,
      cep: cep || existingReseller?.cep,
      endereco: endereco || existingReseller?.endereco,
      numero: numero || existingReseller?.numero,
      complemento: complemento || existingReseller?.complemento || null,
      bairro: bairro || existingReseller?.bairro,
      cidade: cidade || existingReseller?.cidade,
      estado: estado || existingReseller?.estado,
      canal_revenda: canalRevenda || existingReseller?.canal_revenda,
      faixa_investimento: faixaInvestimento || existingReseller?.faixa_investimento,
      observacoes: asNullableText(body.observacoes, 2000) || existingReseller?.observacoes || null,
      status_cadastro: statusMap.reseller,
      motivo_reprovacao: asNullableText(body.motivo_reprovacao, 1000),
      account_manager_user_id: managerUserId,
      account_manager_name: managerName,
      account_manager_email: managerEmail,
      account_manager_whatsapp: managerWhatsapp,
      referred_by_manager_user_id: existingReseller?.referred_by_manager_user_id || null,
      referred_by_manager_name: existingReseller?.referred_by_manager_name || null,
      referred_by_manager_email: existingReseller?.referred_by_manager_email || null,
      referred_by_manager_whatsapp: existingReseller?.referred_by_manager_whatsapp || null,
      referral_code_used: existingReseller?.referral_code_used || null,
      signup_origin: existingReseller?.signup_origin || null,
      updated_at: now,
    }

    if (existingReseller?.id) {
      await updateResellerProfileWithFallback(supabase, existingReseller.id, resellerPayload)
    } else {
      const resellerSchema = await loadTableSchema(supabase, "reseller_profiles")
      const { error: resellerError } = await supabase
        .from("reseller_profiles")
        .insert(filterPayloadToSchema(resellerPayload, resellerSchema))
      if (resellerError) throw resellerError
    }
  }

  return { id: authUserId }
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
    return json(500, { ok: false, error: "admin_env_missing" })
  }

  const serviceRolePayload = decodeJwtPayload(serviceRoleKey)
  if (serviceRolePayload?.role && serviceRolePayload.role !== "service_role") {
    return json(500, {
      ok: false,
      error: "invalid_service_role_key",
      details: `SUPABASE_SERVICE_ROLE_KEY está com role '${serviceRolePayload.role}', mas precisa ser 'service_role'.`,
    })
  }

  let body
  try {
    body = JSON.parse(event.body || "{}")
  } catch {
    return json(400, { ok: false, error: "invalid_json" })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    const frontendSupabaseUrl = normalizeUrl(body?.supabaseUrl)
    const backendSupabaseUrl = normalizeUrl(supabaseUrl)

    if (frontendSupabaseUrl && backendSupabaseUrl && frontendSupabaseUrl !== backendSupabaseUrl) {
      return json(400, {
        ok: false,
        error: "supabase_project_mismatch",
        details: `Frontend: ${frontendSupabaseUrl} | Function: ${backendSupabaseUrl}`,
      })
    }

    const actor = await requireBackofficeUser(event, supabase)
    const scope = await resolveAccessScope(supabase, actor)
    const action = asText(body.action, 120)

    if (!action) {
      return json(400, { ok: false, error: "action_required" })
    }

    let data = null

    switch (action) {
      case "update-order":
        data = await handleUpdateOrder(supabase, body, actor.user.id, scope)
        break
      case "delete-order":
        if (scope.access !== "admin") throw new Error("forbidden")
        data = await handleDeleteOrder(supabase, body, actor.user.id)
        break
      case "create-scoped-order":
        data = await handleCreateScopedOrder(supabase, body, actor, scope)
        break
      case "approve-reseller":
        if (scope.access !== "admin") throw new Error("forbidden")
        data = await handleApproveReseller(supabase, body)
        break
      case "reject-reseller":
        if (scope.access !== "admin") throw new Error("forbidden")
        data = await handleRejectReseller(supabase, body)
        break
      case "update-client":
        data = await handleUpdateClient(supabase, body, scope)
        break
      case "update-user":
        if (scope.access !== "admin") throw new Error("forbidden")
        data = await handleUpdateUser(supabase, body)
        break
      case "delete-user":
        if (scope.access !== "admin") throw new Error("forbidden")
        data = await handleDeleteUser(supabase, body, actor.user.id)
        break
      case "create-user":
        if (scope.access !== "admin") throw new Error("forbidden")
        data = await handleCreateUser(supabase, body)
        break
      default:
        return json(400, { ok: false, error: "unsupported_action" })
    }

    return json(200, { ok: true, data })
  } catch (error) {
    const normalizedError = normalizeError(error)
    const message = normalizedError.message
    console.error("admin-manage error", {
      action: body?.action,
      error: message,
      details: normalizedError.details,
      hint: normalizedError.hint,
      code: normalizedError.code,
      keys: Object.keys(body || {}),
      resellerId: body?.resellerId ?? null,
      userId: body?.userId ?? null,
      hasEmail: Boolean(body?.email),
    })
    const statusCode = message === "unauthorized" ? 401 : message === "forbidden" ? 403 : 400
    return json(statusCode, {
      ok: false,
      error: message,
      details: normalizedError.details,
      hint: normalizedError.hint,
      code: normalizedError.code,
    })
  }
}
