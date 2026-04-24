"use client"

import { Suspense, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

declare global {
  interface Window {
    Razorpay: any;
  }
}

function PaymentBlock() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const rideId = searchParams.get("rideId")
  const baseCost = searchParams.get("baseCost") || "0"
  const pastDues = searchParams.get("pastDues") || "0"
  const totalCost = searchParams.get("totalCost") || "0"

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (!rideId) router.push("/")
  }, [status, router, rideId])

  const handlePayment = async () => {
    try {
      setLoading(true)
      
      if (Number(totalCost) > 0) {
        // 1. Create order
        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "RIDE", id: rideId, amount: totalCost })
        })
        const orderData = await orderRes.json()
        if (!orderRes.ok) throw new Error(orderData.message)

        // 2. Open Razorpay
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: "INR",
          name: "Campus EV Rides",
          description: "Base Fare & Dues",
          order_id: orderData.orderId,
          handler: async function (response: any) {
            try {
              setLoading(true)
              const verifyRes = await fetch("/api/ride/pay-base", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                  rideId, 
                  amount: totalCost,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                }),
              })
              const verifyData = await verifyRes.json()
              if (!verifyRes.ok) throw new Error(verifyData.message)
              router.push("/ride")
            } catch(err: any) {
              setError(err.message)
              setLoading(false)
            }
          },
          theme: { color: "#4f46e5" }
        }
        const rzp = new window.Razorpay(options)
        rzp.on('payment.failed', function (response: any){
          setError("Payment failed: " + response.error.description)
          setLoading(false)
        })
        rzp.open()
      } else {
        const res = await fetch("/api/ride/pay-base", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rideId, amount: 0 }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        router.push("/ride")
      }
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="card glass" style={{ width: "100%", maxWidth: "450px", padding: "clamp(1.5rem, 5vw, 2.5rem) clamp(1rem, 4vw, 2rem)" }}>
      
      <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: "1rem" }}>💳</div>
      <h2 style={{ textAlign: "center", fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Complete Payment to Ride</h2>
      <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "2rem" }}>
        Your scooter is reserved. Pay now to unlock the engine.
      </p>

      <div style={{ padding: "1.5rem", background: "rgba(0,0,0,0.2)", borderRadius: "1rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", color: "var(--text-main)" }}>
          <span>Base Plan Fare:</span>
          <strong>₹{baseCost}</strong>
        </div>
        {Number(pastDues) > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.8rem", color: "var(--danger)" }}>
            <span>Previous Unpaid Dues:</span>
            <strong>+ ₹{pastDues}</strong>
          </div>
        )}
        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.2)", margin: "1rem 0" }}></div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.3rem", fontWeight: 800, color: "var(--primary)" }}>
          <span>Total:</span>
          <span>₹{totalCost}</span>
        </div>
      </div>

      {error && (
        <div style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.875rem", textAlign: "center" }}>
          {error}
        </div>
      )}

      {Number(totalCost) === 0 && (
        <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "1rem", fontWeight: "bold", textAlign: "center" }}>
          ✨ Fully Covered by Active Pass! ✨
        </div>
      )}

      <button 
        className="btn btn-primary" 
        onClick={handlePayment}
        disabled={loading}
        style={{ width: "100%", fontSize: "1.1rem" }}
      >
        {loading ? "Processing..." : (Number(totalCost) > 0 ? "Pay with Razorpay" : "Start Ride")}
      </button>
    </div>
  )

}

export default function PaymentPage() {
  return (
    <div className="app-container" style={{ alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <Suspense fallback={<div className="glass" style={{ padding: '2rem' }}>Loading checkout...</div>}>
        <PaymentBlock />
      </Suspense>
    </div>
  )
}
