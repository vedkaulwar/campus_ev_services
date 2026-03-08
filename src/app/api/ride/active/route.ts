import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/firebase-admin"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // @ts-ignore
    const userId = session.user.id

    // Find active or pending ride
    const rideSnap = await db.collection("rides")
      .where("userId", "==", userId)
      .where("status", "in", ["PENDING", "ACTIVE"])
      .limit(1).get()

    if (rideSnap.empty) {
      return NextResponse.json({ hasActiveRide: false }, { status: 200 })
    }

    const rideDoc = rideSnap.docs[0]
    const ride = rideDoc.data()

    // Get station name
    const stationDoc = await db.collection("stations").doc(ride.startStationId).get()
    const startStation = stationDoc.exists ? stationDoc.data()!.name : "Unknown"

    // Check for active pass
    const now = new Date()
    const passSnap = await db.collection("passes")
      .where("userId", "==", userId)
      .where("expiresAt", ">", now.toISOString())
      .limit(1).get()
    const hasPass = !passSnap.empty

    if (ride.status === "PENDING") {
      return NextResponse.json({
        hasActiveRide: true,
        rideId: rideDoc.id,
        status: "PENDING",
        startStation,
        planDuration: ride.planDuration,
        hasPass
      }, { status: 200 })
    }

    // ACTIVE: calculate elapsed time
    const startTime = new Date(ride.startTime).getTime()
    const nowMs = Date.now()
    const elapsedMinutes = Math.floor((nowMs - startTime) / (1000 * 60))
    const elapsedSeconds = Math.floor((nowMs - startTime) / 1000) % 60

    return NextResponse.json({
      hasActiveRide: true,
      rideId: rideDoc.id,
      status: "ACTIVE",
      startStation,
      planDuration: ride.planDuration,
      otpCode: ride.otpCode,
      startTime: ride.startTime,
      hasPass,
      elapsed: {
        minutes: elapsedMinutes,
        seconds: elapsedSeconds
      }
    }, { status: 200 })
  } catch (error) {
    console.error("Error fetching active ride:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
