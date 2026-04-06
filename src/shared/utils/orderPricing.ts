export type OrderPricingTier = {
  name: "Classic" | "Standard" | "Premium"
  percentage: number
}

export function getDiscountTier(subtotal: number): OrderPricingTier | null {
  if (subtotal >= 5000) return { name: "Premium", percentage: 20 }
  if (subtotal >= 2500) return { name: "Standard", percentage: 12 }
  if (subtotal >= 800) return { name: "Classic", percentage: 5 }
  return null
}

export function calculateAutomaticOrderPricing(subtotal: number, paymentMethod?: string | null) {
  if (paymentMethod === "credit_card") {
    return {
      tier: null,
      planDiscount: 0,
      pixDiscount: 0,
      automaticDiscount: 0,
      total: Number(subtotal.toFixed(2)),
    }
  }

  const tier = getDiscountTier(subtotal)
  const planDiscount = tier ? Number((subtotal * (tier.percentage / 100)).toFixed(2)) : 0
  const totalAfterPlan = Number((subtotal - planDiscount).toFixed(2))
  const pixDiscount = paymentMethod === "pix" ? Number((totalAfterPlan * 0.05).toFixed(2)) : 0
  const automaticDiscount = Number((planDiscount + pixDiscount).toFixed(2))
  const total = Number((subtotal - automaticDiscount).toFixed(2))

  return {
    tier,
    planDiscount,
    pixDiscount,
    automaticDiscount,
    total,
  }
}
