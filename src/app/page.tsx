"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Link from "next/link"
import ThemeToggle from "@/components/ThemeToggle"

type Station = {
  id: string
  name: string
  latitude: number
  longitude: number
  bikes: Bike[]
}

type Bike = {
  id: string
  status: string
  battery: number
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStation, setSelectedStation] = useState<Station | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [planError, setPlanError] = useState("")
  const [hasPass, setHasPass] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [stationsRes, passRes, rideRes] = await Promise.all([
          fetch("/api/stations"),
          fetch("/api/passes/active"),
          fetch("/api/ride/active")
        ])
        const stationsData = await stationsRes.json()
        const passData = await passRes.json()
        const rideData = await rideRes.json()
        
        if (rideData.hasActiveRide) {
          router.push("/ride")
          return
        }

        setStations(stationsData)
        setHasPass(passData.hasPass)
      } catch (error) {
        console.error("Failed to fetch initial data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (status === "authenticated") {
      fetchInitialData()
    }
  }, [status, router])

  const initiateRideClick = (station: Station) => {
    if (hasPass) {
      // Direct booking with default max-base time (15m) if user has pass
      setSelectedStation(station)
      handleBookRide(15, station.id)
    } else {
      // Normal flow, trigger modal
      setSelectedStation(station)
    }
  }

  const handleBookRide = async (planDuration: number, directStationId?: string) => {
    const targetStationId = directStationId || selectedStation?.id
    if (!targetStationId) return
    setPlanLoading(true)
    setPlanError("")

    try {
      const res = await fetch("/api/ride/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          startStationId: targetStationId,
          planDuration: planDuration
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      // Ride booked successfully, now redirect to the ride screen
      router.push(`/ride`)
    } catch (err: any) {
      setPlanError(err.message)
      setPlanLoading(false)
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="app-container" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="animate-pulse" style={{ fontSize: "2rem", color: "var(--primary)" }}>
          ⚡ Loading CampusEV...
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="app-container">
      <header className="app-header glass">
        <Link href="/" className="app-logo">
          ⚡ CampusEV
        </Link>
        <div className="user-profile" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span>Hi, {session.user?.name}</span>
          <ThemeToggle />
          <button 
            onClick={() => signOut()} 
            className="btn btn-secondary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", width: "auto" }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="main-content" style={{ padding: 0, maxWidth: "100%", paddingTop: "0" }}>
        {/* Dynamic Campus Hero Section */}
        <section style={{ 
          position: "relative",
          width: "100%", 
          height: "35vh", 
          minHeight: "350px",
          display: "flex", 
          flexDirection: "column",
          justifyContent: "center",
          padding: "2rem 5%",
          backgroundImage: "linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url('/images/dashboard_hero.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "white",
          marginBottom: "3rem"
        }}>
          <h1 style={{ fontSize: "3.5rem", fontWeight: 800, marginBottom: "1rem", textShadow: "0 4px 15px rgba(0,0,0,0.7)" }}>
            Your Campus, Connected.
          </h1>
          <p style={{ fontSize: "1.25rem", maxWidth: "650px", textShadow: "0 2px 10px rgba(0,0,0,0.6)", lineHeight: 1.6 }}>
            Say goodbye to endless walking. Locate and instantly unlock a premium electric scooter from multiple points around MIT-ADT Kalbhor.
          </p>
        </section>

        <section style={{ padding: "0 5%", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Campus Stations</h2>
            <Link href="/passes" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
              View Passes & Plans →
            </Link>
          </div>

          <div className="grid-cards">
            {stations.map((station) => (
              <div key={station.id} className="card glass">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <h3 className="card-title">{station.name}</h3>
                  <span className={`badge ${station.bikes.length > 0 ? 'badge-success' : 'badge-danger'}`}>
                    {station.bikes.length} Bikes
                  </span>
                </div>
                
                <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                  {station.bikes.length > 0 
                    ? "Scooters are available for rent at this location." 
                    : "No scooters available at the moment."}
                </p>

                <button 
                  className="btn btn-primary" 
                  disabled={station.bikes.length === 0}
                  onClick={() => initiateRideClick(station)}
                >
                  Start Ride Here
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Plan Selection Modal */}
        {selectedStation && !hasPass && !planLoading && (
          <div style={{
            position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem", zIndex: 100
          }}>
            <div className="card glass" style={{ width: "100%", maxWidth: "450px", backgroundColor: "var(--surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Select a Plan</h3>
                <button 
                  onClick={() => { setSelectedStation(null); setPlanError(""); }} 
                  style={{ background: "transparent", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  ×
                </button>
              </div>

              <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                You are booking a scooter at <strong>{selectedStation.name}</strong>. Choose a base duration plan:
              </p>

              {planError && (
                <div style={{ color: "var(--danger)", marginBottom: "1rem", fontSize: "0.875rem", background: "rgba(239, 68, 68, 0.1)", padding: "0.5rem", borderRadius: "0.5rem" }}>
                  {planError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <button className="btn btn-secondary" onClick={() => handleBookRide(5)} disabled={planLoading}>
                  5 Minutes - ₹20
                </button>
                <button className="btn btn-secondary" onClick={() => handleBookRide(10)} disabled={planLoading}>
                  10 Minutes - ₹30
                </button>
                <button className="btn btn-secondary" onClick={() => handleBookRide(15)} disabled={planLoading}>
                  15 Minutes - ₹40
                </button>
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem", textAlign: "center" }}>
                Extra charges apply for exceeding base time limits.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
