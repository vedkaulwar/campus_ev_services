"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import ThemeToggle from "@/components/ThemeToggle"

export default function PassesPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const buyPass = async (type: string) => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const res = await fetch("/api/passes/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      setMessage(`Success! You have purchased a ${type} pass.`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="app-container" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="animate-pulse" style={{ fontSize: "2rem", color: "var(--primary)" }}>
          ⚡ Loading Passes...
        </div>
      </div>
    )
  }

  return (
    <div className="app-container" style={{ padding: "1.5rem" }}>
      <header className="app-header glass" style={{ marginBottom: "2rem", borderRadius: "1rem" }}>
        <Link href="/" className="app-logo">⚡ CampusEV</Link>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <ThemeToggle />
          <Link href="/" className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", textDecoration: "none" }}>
            Back to Dashboard
          </Link>
        </div>
      </header>

      <main style={{ maxWidth: "1000px", margin: "0 auto", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <h1 style={{ fontSize: "3rem", fontWeight: 800, color: "var(--text-main)", marginBottom: "1rem" }}>
            Campus EV Passes
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "1.2rem", maxWidth: "600px", margin: "0 auto" }}>
            Unlimited rides subject to basic time limits. Perfect for regular campus commuters!
          </p>
        </div>

        {message && (
          <div style={{ padding: "1rem", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "0.75rem", marginBottom: "2rem", textAlign: "center", fontWeight: "bold" }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", borderRadius: "0.75rem", marginBottom: "2rem", textAlign: "center", fontWeight: "bold" }}>
            {error}
          </div>
        )}

        <div className="grid-cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
          {/* Daily Pass */}
          <div className="card glass" style={{ border: "2px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", position: "relative" }}>
            <h3 style={{ fontSize: "1.5rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>Daily Pass</h3>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--primary)", margin: "1rem 0" }}>₹50</div>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.95rem" }}>
              Valid for 24 hours. The standard ride base limits still apply, but base fees are waived.
            </p>
            <button 
              className="btn btn-secondary" 
              style={{ width: "100%", marginTop: "auto" }}
              disabled={loading}
              onClick={() => buyPass("DAILY")}
            >
              {loading ? "Processing..." : "Buy Daily Pass"}
            </button>
          </div>

          {/* Weekly Pass */}
          <div className="card glass" style={{ border: "2px solid var(--primary)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", transform: "scale(1.05)", zIndex: 10, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)" }}>
            <div style={{ position: "absolute", top: "-15px", background: "var(--primary)", color: "white", padding: "0.5rem 1rem", borderRadius: "1rem", fontSize: "0.8rem", fontWeight: "bold", letterSpacing: "1px" }}>
              MOST POPULAR
            </div>
            <h3 style={{ fontSize: "1.5rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>Weekly Pass</h3>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--primary)", margin: "1rem 0" }}>₹200</div>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.95rem" }}>
              Valid for 7 days. Enjoy worry-free commuting all week long across the campus.
            </p>
            <button 
              className="btn btn-primary" 
              style={{ width: "100%", marginTop: "auto" }}
              disabled={loading}
              onClick={() => buyPass("WEEKLY")}
            >
              {loading ? "Processing..." : "Buy Weekly Pass"}
            </button>
          </div>

          {/* Monthly Pass */}
          <div className="card glass" style={{ border: "2px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
            <h3 style={{ fontSize: "1.5rem", color: "var(--text-main)", marginBottom: "0.5rem" }}>Monthly Pass</h3>
            <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--primary)", margin: "1rem 0" }}>₹500</div>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem", fontSize: "0.95rem" }}>
              Valid for 30 days. The ultimate value for students living on the MIT-ADT campus.
            </p>
            <button 
              className="btn btn-secondary" 
              style={{ width: "100%", marginTop: "auto" }}
              disabled={loading}
              onClick={() => buyPass("MONTHLY")}
            >
              {loading ? "Processing..." : "Buy Monthly Pass"}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
