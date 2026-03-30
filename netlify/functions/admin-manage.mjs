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
    case "cliente":
      return { role: "client", userType: "cliente" }
    case "gerente":
      return { role: "admin", userType: "gerente" }
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

async function requireAdmin(event, supabase) {
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

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, auth_user_id, email, role, full_name")
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle()

  if (profileError || !profile || profile.role !== "admin") {
    throw new Error("forbidden")
  }

  return { user, profile }
}

async function upsertLegacyProfile(supabase, payload) {
  const { data: existing, error: loadError } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", payload.auth_user_id)
    .maybeSingle()

  if (loadError) throw loadError

  if (existing?.id) {
    const { error } = await supabase.from("profiles").update(payload).eq("id", existing.id)
    if (error) throw error
    return existing.id
  }

  const { data, error } = await supabase.from("profiles").insert(payload).select("id").single()
  if (error) throw error
  return data.id
}

async function handleUpdateOrder(supabase, body, adminUserId) {
  const orderId = asText(body.orderId, 120)
  if (!orderId) throw new Error("order_id_required")

  const { data: currentOrder, error: currentError } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("id", orderId)
    .is("deleted_at", null)
    .single()

  if (currentError || !currentOrder) throw new Error("order_not_found")

  const items = sanitizeOrderItems(body.items)
  const subtotal = Number(items.reduce((sum, item) => sum + asNumber(item.subtotal), 0).toFixed(2))

  const discountType = asNullableText(body.admin_discount_type, 20)
  const discountValue = Math.max(0, asNumber(body.admin_discount_value))
  const discountAmount = Number(Math.max(0, asNumber(body.admin_discount_amount)).toFixed(2))

  const bonusType = asNullableText(body.admin_bonus_type, 20)
  const bonusValue = Math.max(0, asNumber(body.admin_bonus_value))
  const bonusAmount = Number(Math.max(0, asNumber(body.admin_bonus_amount)).toFixed(2))
  const total = Number(Math.max(0, subtotal - discountAmount - bonusAmount).toFixed(2))

  const status = asText(body.status, 64) || "aguardando_aprovacao"
  const payload = {
    items,
    subtotal,
    original_total: subtotal,
    total,
    status: toDatabaseOrderStatus(status),
    payment_status: body.payment_status || derivePaymentStatus(status, currentOrder.payment_status),
    payment_method: asNullableText(body.payment_method, 32) || null,
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
    updated_by_admin_id: adminUserId,
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

async function handleApproveReseller(supabase, body) {
  const resellerId = asText(body.resellerId, 120)
  const managerName = asNullableText(body.managerName, 255)
  const managerWhatsapp = asNullableText(body.managerWhatsapp, 64)
  if (!resellerId) throw new Error("reseller_id_required")

  const { data: reseller, error: loadError } = await supabase
    .from("reseller_profiles")
    .select("*")
    .eq("id", resellerId)
    .single()

  if (loadError || !reseller) throw new Error("reseller_not_found")

  const now = new Date().toISOString()
  const { error: resellerError } = await supabase
    .from("reseller_profiles")
    .update({
      status_cadastro: "approved",
      motivo_reprovacao: null,
      account_manager_name: managerName,
      account_manager_whatsapp: managerWhatsapp,
      updated_at: now,
    })
    .eq("id", resellerId)

  if (resellerError) throw resellerError

  await upsertLegacyProfile(supabase, {
    auth_user_id: reseller.user_id,
    full_name: reseller.nome_responsavel,
    email: reseller.email,
    role: "client",
    user_type: "cliente",
    status_cadastro: "aprovado",
    tipo_documento: "cnpj",
    documento: reseller.cnpj,
    telefone: reseller.whatsapp || reseller.telefone,
    endereco: {
      cep: reseller.cep,
      endereco: reseller.endereco,
      numero: reseller.numero,
      complemento: reseller.complemento,
      bairro: reseller.bairro,
      cidade: reseller.cidade,
      estado: reseller.estado,
    },
    motivo_reprovacao: null,
    account_manager_name: managerName,
    account_manager_whatsapp: managerWhatsapp,
    updated_at: now,
  })

  return { id: resellerId }
}

async function handleRejectReseller(supabase, body) {
  const resellerId = asText(body.resellerId, 120)
  const reason = asText(body.reason, 1000) || "Cadastro reprovado pela equipe comercial."
  if (!resellerId) throw new Error("reseller_id_required")

  const { data: reseller, error: loadError } = await supabase
    .from("reseller_profiles")
    .select("*")
    .eq("id", resellerId)
    .single()

  if (loadError || !reseller) throw new Error("reseller_not_found")

  const now = new Date().toISOString()
  const { error: resellerError } = await supabase
    .from("reseller_profiles")
    .update({
      status_cadastro: "rejected",
      motivo_reprovacao: reason,
      updated_at: now,
    })
    .eq("id", resellerId)

  if (resellerError) throw resellerError

  await upsertLegacyProfile(supabase, {
    auth_user_id: reseller.user_id,
    full_name: reseller.nome_responsavel,
    email: reseller.email,
    role: "client",
    user_type: "cliente",
    status_cadastro: "reprovado",
    tipo_documento: "cnpj",
    documento: reseller.cnpj,
    telefone: reseller.whatsapp || reseller.telefone,
    endereco: {
      cep: reseller.cep,
      endereco: reseller.endereco,
      numero: reseller.numero,
      complemento: reseller.complemento,
      bairro: reseller.bairro,
      cidade: reseller.cidade,
      estado: reseller.estado,
    },
    motivo_reprovacao: reason,
    updated_at: now,
  })

  return { id: resellerId }
}

async function handleUpdateClient(supabase, body) {
  const resellerId = asText(body.resellerId, 120)
  if (!resellerId) throw new Error("reseller_id_required")

  const { data: reseller, error: loadError } = await supabase
    .from("reseller_profiles")
    .select("*")
    .eq("id", resellerId)
    .single()

  if (loadError || !reseller) throw new Error("reseller_not_found")

  const statusMap = normalizeApprovalStatus(body.status_cadastro)
  const now = new Date().toISOString()
  const resellerPayload = {
    razao_social: asNullableText(body.razao_social, 255) || reseller.razao_social,
    nome_fantasia: asNullableText(body.nome_fantasia, 255),
    cnpj: asNullableText(body.cnpj, 32) || reseller.cnpj,
    nome_responsavel: asNullableText(body.nome_responsavel, 255) || reseller.nome_responsavel,
    email: asNullableText(body.email, 255) || reseller.email,
    telefone: asNullableText(body.telefone, 64) || reseller.telefone,
    whatsapp: asNullableText(body.whatsapp, 64),
    endereco: asNullableText(body.endereco, 255) || reseller.endereco,
    numero: asNullableText(body.numero, 32) || reseller.numero,
    complemento: asNullableText(body.complemento, 120),
    bairro: asNullableText(body.bairro, 120) || reseller.bairro,
    cidade: asNullableText(body.cidade, 120) || reseller.cidade,
    estado: asNullableText(body.estado, 80) || reseller.estado,
    cep: asNullableText(body.cep, 32) || reseller.cep,
    observacoes: asNullableText(body.observacoes, 2000),
    status_cadastro: statusMap.reseller,
    motivo_reprovacao: asNullableText(body.motivo_reprovacao, 1000),
    updated_at: now,
  }

  const { error: resellerError } = await supabase.from("reseller_profiles").update(resellerPayload).eq("id", resellerId)
  if (resellerError) throw resellerError

  await upsertLegacyProfile(supabase, {
    auth_user_id: reseller.user_id,
    full_name: asNullableText(body.nome_responsavel, 255) || reseller.nome_responsavel,
    email: resellerPayload.email,
    role: "client",
    user_type: asNullableText(body.user_type, 32) || "cliente",
    status_cadastro: statusMap.profile,
    tipo_documento: "cnpj",
    documento: resellerPayload.cnpj,
    telefone: resellerPayload.whatsapp || resellerPayload.telefone,
    endereco: {
      cep: resellerPayload.cep,
      endereco: resellerPayload.endereco,
      numero: resellerPayload.numero,
      complemento: resellerPayload.complemento,
      bairro: resellerPayload.bairro,
      cidade: resellerPayload.cidade,
      estado: resellerPayload.estado,
    },
    motivo_reprovacao: resellerPayload.motivo_reprovacao,
    notes: asNullableText(body.notes, 2000),
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
      full_name: fullName,
      telefone: phone,
      documento,
      tipo_documento: tipoDocumento,
      user_type: userType,
    },
  })

  if (createError || !created.user) throw createError || new Error("user_create_failed")

  const now = new Date().toISOString()
  try {
    await upsertLegacyProfile(supabase, {
      auth_user_id: created.user.id,
      full_name: fullName,
      email,
      role,
      user_type: userType,
      status_cadastro: statusMap.profile,
      tipo_documento: tipoDocumento,
      documento,
      telefone: phone,
      notes,
      updated_at: now,
    })

    if (role === "client") {
      const { error: resellerError } = await supabase.from("reseller_profiles").insert({
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
      })

      if (resellerError) throw resellerError
    }
  } catch (error) {
    await supabase.auth.admin.deleteUser(created.user.id)
    throw error
  }

  return { id: created.user.id, email, role, user_type: userType }
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
    const { user } = await requireAdmin(event, supabase)
    const action = asText(body.action, 120)

    if (!action) {
      return json(400, { ok: false, error: "action_required" })
    }

    let data = null

    switch (action) {
      case "update-order":
        data = await handleUpdateOrder(supabase, body, user.id)
        break
      case "delete-order":
        data = await handleDeleteOrder(supabase, body, user.id)
        break
      case "approve-reseller":
        data = await handleApproveReseller(supabase, body)
        break
      case "reject-reseller":
        data = await handleRejectReseller(supabase, body)
        break
      case "update-client":
        data = await handleUpdateClient(supabase, body)
        break
      case "create-user":
        data = await handleCreateUser(supabase, body)
        break
      default:
        return json(400, { ok: false, error: "unsupported_action" })
    }

    return json(200, { ok: true, data })
  } catch (error) {
    const message = error instanceof Error ? error.message : "unexpected_error"
    const statusCode = message === "unauthorized" ? 401 : message === "forbidden" ? 403 : 400
    return json(statusCode, { ok: false, error: message })
  }
}
