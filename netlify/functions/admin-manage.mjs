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

  const pickAdminProfile = (rows = []) =>
    rows.find((row) => row?.role === "admin" || row?.user_type === "admin") || rows[0] || null

  let profile = null

  const { data: byAuthProfiles, error: byAuthError } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .limit(10)

  if (!byAuthError) {
    profile = pickAdminProfile(byAuthProfiles || [])
  }

  if (!profile && user.email) {
    const { data: exactEmailProfiles, error: exactEmailError } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .limit(10)

    if (!exactEmailError) {
      profile = pickAdminProfile(exactEmailProfiles || [])
    }
  }

  if (!profile && user.email) {
    const { data: insensitiveEmailProfiles, error: insensitiveEmailError } = await supabase
      .from("profiles")
      .select("*")
      .ilike("email", user.email)
      .limit(10)

    if (!insensitiveEmailError) {
      profile = pickAdminProfile(insensitiveEmailProfiles || [])
    }
  }

  if (!profile || (profile.role !== "admin" && profile.user_type !== "admin")) {
    if (user.user_metadata?.user_type === "admin" || user.app_metadata?.role === "admin") {
      return {
        user,
        profile: {
          id: profile?.id || user.id,
          auth_user_id: user.id,
          email: user.email,
          role: "admin",
          user_type: "admin",
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email,
        },
      }
    }

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

async function findResellerProfile(supabase, { resellerId, authUserId, email }) {
  if (resellerId) {
    const { data, error } = await supabase.from("reseller_profiles").select("*").eq("id", resellerId).maybeSingle()
    if (error) throw error
    if (data) return data
  }

  if (authUserId) {
    const { data, error } = await supabase
      .from("reseller_profiles")
      .select("*")
      .eq("user_id", authUserId)
      .maybeSingle()

    if (error) throw error
    if (data) return data
  }

  if (email) {
    const { data, error } = await supabase
      .from("reseller_profiles")
      .select("*")
      .eq("email", email)
      .maybeSingle()

    if (error) throw error
    if (data) return data
  }

  return null
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
  const giftItems = sanitizeGiftItems(body.gift_items)
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
    gift_items: giftItems,
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
    full_name: getClientDisplayName({
      razaoSocial: resellerPayload.razao_social,
      fullName: resellerPayload.nome_responsavel,
    }),
    email: resellerPayload.email,
    role: "client",
    user_type: asNullableText(body.user_type, 32) || "cliente",
    company_name: resellerPayload.razao_social,
    status_cadastro: statusMap.profile,
    tipo_documento: "cnpj",
    documento: resellerPayload.cnpj,
    telefone: resellerPayload.whatsapp || resellerPayload.telefone,
    endereco: buildAddressPayload(resellerPayload),
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
  const companyName = asNullableText(body.company_name, 255)
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

async function handleUpdateUser(supabase, body) {
  const targetId = asText(body.userId, 120)
  if (!targetId) throw new Error("user_id_required")

  const { data: loadedProfile, error: existingProfileError } = await supabase
    .from("profiles")
    .select("*")
    .or(`id.eq.${targetId},auth_user_id.eq.${targetId}`)
    .maybeSingle()

  if (existingProfileError) throw existingProfileError
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
      account_manager_name: resellerProfile.account_manager_name || null,
      account_manager_whatsapp: resellerProfile.account_manager_whatsapp || null,
      notes: null,
    }
  }

  if (!existingProfile) throw new Error("user_not_found")

  const authUserId = existingProfile.auth_user_id || resellerProfile?.user_id || targetId
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

  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(authUserId, {
    email,
    user_metadata: {
      full_name: finalFullName,
      telefone: phone || existingReseller?.telefone || existingProfile.telefone || null,
      documento: documento || existingReseller?.cnpj || existingProfile.documento || null,
      tipo_documento: role === "client" ? "cnpj" : tipoDocumento || existingProfile.tipo_documento || null,
      user_type: userType,
      company_name: role === "client" ? finalRazaoSocial : companyName || existingProfile.company_name || null,
    },
  })

  if (authUpdateError) throw authUpdateError

  const now = new Date().toISOString()
  await upsertLegacyProfile(supabase, {
    auth_user_id: authUserId,
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
    account_manager_name: asNullableText(body.account_manager_name, 255) || existingProfile.account_manager_name || existingReseller?.account_manager_name || null,
    account_manager_whatsapp: asNullableText(body.account_manager_whatsapp, 64) || existingProfile.account_manager_whatsapp || existingReseller?.account_manager_whatsapp || null,
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
      account_manager_name:
        asNullableText(body.account_manager_name, 255) || existingReseller?.account_manager_name || existingProfile.account_manager_name || null,
      account_manager_whatsapp:
        asNullableText(body.account_manager_whatsapp, 64) || existingReseller?.account_manager_whatsapp || existingProfile.account_manager_whatsapp || null,
      updated_at: now,
    }

    if (existingReseller?.id) {
      const { error: resellerError } = await supabase.from("reseller_profiles").update(resellerPayload).eq("id", existingReseller.id)
      if (resellerError) throw resellerError
    } else {
      const { error: resellerError } = await supabase.from("reseller_profiles").insert(resellerPayload)
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
      case "update-user":
        data = await handleUpdateUser(supabase, body)
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
