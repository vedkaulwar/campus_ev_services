"use client"

import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import ThemeToggle from "@/components/ThemeToggle"

export default function RidePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [activeRide, setActiveRide] = useState<any>(null)
  
  const [stations, setStations] = useState<any[]>([])
  const [endStationId, setEndStationId] = useState("")
  
  const [elapsed, setElapsed] = useState({ minutes: 0, seconds: 0 })
  const [error, setError] = useState("")
  const [unlockLoading, setUnlockLoading] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  const fetchRideStatus = async () => {
    try {
      const res = await fetch(`/api/ride/active?t=${Date.now()}`)
      const data = await res.json()
      
      if (data.hasActiveRide) {
        setActiveRide(data)
        if (data.status === "ACTIVE") {
          setElapsed(data.elapsed)
        }
      } else {
        router.push("/")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllStations = async () => {
    try {
      const res = await fetch(`/api/stations?t=${Date.now()}`)
      const data = await res.json()
      setStations(data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      fetchRideStatus()
      fetchAllStations()
    }
  }, [status])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeRide && activeRide.status === "ACTIVE") {
      interval = setInterval(() => {
        setElapsed(prev => {
          let mins = prev.minutes
          let secs = prev.seconds + 1
          if (secs === 60) {
            secs = 0
            mins += 1
          }
          return { minutes: mins, seconds: secs }
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [activeRide])

  const unlockEngine = async () => {
    try {
      setUnlockLoading(true)
      setError("")
      const res = await fetch("/api/ride/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId: activeRide.rideId }),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message)
      
      fetchRideStatus()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUnlockLoading(false)
    }
  }

  const endRide = async () => {
    if (!endStationId) {
      setError("Please select a drop-off station.")
      return
    }

    try {
      setLoading(true)
      const res = await fetch("/api/ride/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rideId: activeRide.rideId, 
          endStationId 
        }),
      })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message)
      
      // Transition complete, returning to dashboard
      router.push(`/`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="app-container" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="animate-pulse" style={{ fontSize: "2rem", color: "var(--primary)" }}>
          ⚡ Loading Ride Info...
        </div>
      </div>
    )
  }

  if (!activeRide) return null

  const isApproachingLimit = activeRide.status === "ACTIVE" && 
                             (activeRide.planDuration - elapsed.minutes === 1);

  return (
    <div className="app-container" style={{ padding: "1rem", backgroundImage: "linear-gradient(135deg, var(--background) 0%, #1e293b 100%)" }}>
      <header className="app-header glass" style={{ borderRadius: "1rem", marginBottom: "2rem" }}>
        <div className="app-logo">⚡ Active Ride</div>
        <div className="user-profile">
          <ThemeToggle />
          <button onClick={() => router.push("/")} className="btn-secondary" style={{ padding: "0.25rem 0.5rem", borderRadius: "0.5rem", border: "1px solid var(--text-muted)", color: "var(--text-main)", background: "transparent", cursor: "pointer" }}>
            Dashboard
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "600px", margin: "0 auto", width: "100%" }}>
        {error && (
          <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", borderRadius: "0.75rem", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}

        {activeRide.status === "PENDING" ? (
          <div className="card glass" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🔒</div>
            <h2 style={{ fontSize: "1.8rem", color: "var(--text-main)", marginBottom: "1rem" }}>
              Scooter is Locked
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
              Reach out to your reserved scooter at <strong>{activeRide.startStation}</strong>.
              <br/>Click the button below to generate the unlock OTP and start the engine timer.
            </p>
            
            <button 
              className="btn btn-primary" 
              onClick={unlockEngine}
              disabled={unlockLoading}
              style={{ padding: "1rem 2rem", fontSize: "1.2rem", width: "100%", maxWidth: "300px" }}
            >
              {unlockLoading ? "Starting Engine..." : "Start Engine"}
            </button>
          </div>
        ) : (
          <div className="card glass" style={{ textAlign: "center", padding: "3rem 2rem" }}>
            <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "1rem" }}>
              Ride Duration
            </div>
            
            <div style={{ fontSize: "4.5rem", fontWeight: 800, fontFamily: "monospace", color: "var(--primary)", lineHeight: 1, marginBottom: "0.5rem" }}>
              {String(elapsed.minutes).padStart(2, "0")}:{String(elapsed.seconds).padStart(2, "0")}
            </div>

            <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--text-main)", marginBottom: "2rem", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
              <div>
                OTP to Unlock Machine: <span style={{ padding: "0.25rem 0.5rem", background: "var(--primary)", color: "white", borderRadius: "0.25rem", letterSpacing: "1px" }}>{activeRide.otpCode}</span>
              </div>
            </div>

            {isApproachingLimit && !activeRide.hasPass && (
              <div className="animate-pulse" style={{ padding: "0.8rem", background: "rgba(245, 158, 11, 0.2)", color: "#f59e0b", borderRadius: "0.5rem", marginBottom: "2rem", fontWeight: 600 }}>
                ⚠️ Warning: 1 minute left on your {activeRide.planDuration} min base plan!
              </div>
            )}

            <div style={{ textAlign: "left", display: "grid", gap: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)", borderBottom: "1px solid rgba(255,255,255,0.1)", padding: "1.5rem 0", marginBottom: "2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Started From:</span>
                <span style={{ fontWeight: 600 }}>{activeRide.startStation}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-muted)" }}>Current Plan:</span>
                <span style={{ fontWeight: 600 }}>{activeRide.hasPass ? "Unlimited Pass" : `${activeRide.planDuration} Minutes Base`}</span>
              </div>
            </div>

            <div className="form-group" style={{ textAlign: "left", marginBottom: "1.5rem" }}>
              <label htmlFor="endStation" style={{ marginBottom: "0.5rem" }}>Select Drop-off Station</label>
              <select 
                id="endStation"
                className="glass"
                style={{ width: "100%", padding: "1rem", borderRadius: "0.75rem", color: "var(--text-main)", background: "rgba(var(--surface-rgb, 255,255,255), 0.5)", border: "1px solid rgba(255,255,255,0.2)", fontSize: "1rem", outline: "none", cursor: "pointer" }}
                value={endStationId}
                onChange={(e) => setEndStationId(e.target.value)}
              >
                <option value="" disabled>Choose where you parked...</option>
                {stations.map(st => (
                  <option key={st.id} value={st.id} style={{ color: "#000" }}>{st.name}</option>
                ))}
              </select>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ padding: "1.25rem", fontSize: "1.2rem", backgroundColor: "var(--danger)" }}
              onClick={endRide}
            >
              End Ride
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
