import crypto from "crypto"

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!orderId || !paymentId || !signature) return false

  const secret = process.env.RAZORPAY_KEY_SECRET || ""
  const hmac = crypto.createHmac("sha256", secret)
  
  hmac.update(`${orderId}|${paymentId}`)
  const generatedSignature = hmac.digest("hex")
  
  return generatedSignature === signature
}
