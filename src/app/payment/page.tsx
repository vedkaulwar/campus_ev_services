"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function PaymentPage() {
  const { status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const rideId = searchParams.get("rideId")
  const cost = searchParams.get("cost")
  const duration = searchParams.get("duration")

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
    if (!rideId) router.push("/")
  }, [status, router, rideId])

  const handlePayment = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/ride/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId }),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message)
      
      alert("Payment Successful! Thank you for riding with CampusEV.")
      router.push("/")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-container" style={{ alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div className="card glass" style={{ width: "100%", maxWidth: "400px", textAlign: "center", padding: "2.5rem 2rem" }}>
        
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🧾</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Ride Completed</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
          You rode for {duration} minutes.
        </p>

        <div style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--primary)", marginBottom: "2rem" }}>
          ₹{cost}
        </div>

        {error && (
          <div style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.875rem" }}>
            {error}
          </div>
        )}

        {Number(cost) > 0 ? (
          <div style={{ marginBottom: "2rem", border: "1px dashed rgba(255,255,255,0.3)", padding: "1rem", borderRadius: "1rem" }}>
            {/* Mock QR Code Image */}
            <div style={{
              width: "200px", height: "200px", 
              margin: "0 auto", 
              backgroundImage: `url('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=campusev@mitadt&pn=CampusEV&am=${cost}')`,
              backgroundSize: "contain",
              backgroundColor: "white", padding: "0.5rem", borderRadius: "0.5rem"
            }}></div>
            <p style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginTop: "1rem" }}>Scan QR to Pay with any UPI app</p>
          </div>
        ) : (
          <div style={{ marginBottom: "2rem", padding: "1.5rem", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "1rem", fontWeight: "bold" }}>
            ✨ Fully Covered by Active Pass! ✨
          </div>
        )}

        <button 
          className="btn btn-primary" 
          onClick={handlePayment}
          disabled={loading}
          style={{ width: "100%", fontSize: "1.1rem" }}
        >
          {loading ? "Processing..." : (Number(cost) > 0 ? "I have paid, Finish Ride" : "Finish Ride")}
        </button>
      </div>
    </div>
  )
}
