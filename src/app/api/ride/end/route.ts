import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // @ts-ignore
    const userId = session.user.id
    const { rideId, endStationId } = await req.json()

    if (!rideId || !endStationId) {
      return NextResponse.json({ message: "Ride ID and End Station ID are required" }, { status: 400 })
    }

    // Fetch the active ride
    const rideRef = db.collection("rides").doc(rideId)
    const rideDoc = await rideRef.get()

    if (!rideDoc.exists) {
      return NextResponse.json({ message: "Active ride not found" }, { status: 404 })
    }

    const ride = rideDoc.data()!

    if (ride.userId !== userId || ride.status !== "ACTIVE") {
      return NextResponse.json({ message: "Active ride not found" }, { status: 404 })
    }

    // Verify the end station exists
    const endStationDoc = await db.collection("stations").doc(endStationId).get()
    if (!endStationDoc.exists) {
      return NextResponse.json({ message: "Invalid Drop-off Station" }, { status: 400 })
    }

    const endTime = new Date()
    const startTime = new Date(ride.startTime)
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationMinutes = Math.ceil(durationMs / (1000 * 60))

    // Base pricing
    let cost = 0
    if (ride.planDuration === 5) cost = 20
    else if (ride.planDuration === 10) cost = 30
    else if (ride.planDuration === 15) cost = 40
    else cost = 20

    // Extra charges beyond plan
    if (durationMinutes > ride.planDuration) {
      const extraMinutes = durationMinutes - ride.planDuration
      cost += (extraMinutes * 5)
    }

    // Check for active pass to override pricing
    const nowISO = new Date().toISOString()
    const passSnap = await db.collection("passes")
      .where("userId", "==", userId)
      .get()

    const hasActivePass = passSnap.docs.some((doc: any) => doc.data().expiresAt > nowISO)

    if (hasActivePass) {
      if (durationMinutes <= ride.planDuration) {
        cost = 0 // Fully covered
      } else {
        const extraMinutes = durationMinutes - ride.planDuration
        cost = extraMinutes * 5 // Only pay overtime
      }
    }

    // Update ride status to COMPLETED
    await rideRef.update({
      endTime: endTime.toISOString(),
      endStationId,
      status: "COMPLETED",
      cost,
    })

    // Move the bike to end station and mark it AVAILABLE
    // Handling case where start and end stations are the same
    if (ride.startStationId === endStationId) {
      const stationRef = db.collection("stations").doc(endStationId)
      const stationDoc = await stationRef.get()
      if (stationDoc.exists) {
        let bikes: any[] = stationDoc.data()!.bikes || []
        // Find and update the specific bike
        const bikeIdx = bikes.findIndex(b => b.id === ride.bikeId)
        if (bikeIdx !== -1) {
          bikes[bikeIdx].status = "AVAILABLE"
        } else {
          // Fallback: if bike somehow went missing from array, add it back
          bikes.push({ id: ride.bikeId, status: "AVAILABLE", battery: 80 })
        }
        await stationRef.update({ bikes })
      }
    } else {
      // Different stations: Remove from start, Add to end
      // 1. Add to end station
      const endStationRef = db.collection("stations").doc(endStationId)
      const endStationData = (await endStationRef.get()).data()!
      const endBikes: any[] = endStationData.bikes || []
      endBikes.push({ id: ride.bikeId, status: "AVAILABLE", battery: 80 })
      await endStationRef.update({ bikes: endBikes })

      // 2. Remove from start station
      const startStationRef = db.collection("stations").doc(ride.startStationId)
      const startStationDoc = await startStationRef.get()
      if (startStationDoc.exists) {
        const startBikes: any[] = startStationDoc.data()!.bikes || []
        const filtered = startBikes.filter((b: any) => b.id !== ride.bikeId)
        await startStationRef.update({ bikes: filtered })
      }
    }

    return NextResponse.json(
      { 
        message: "Ride ended successfully", 
        durationMinutes,
        cost,
        receipt: `Ride duration: ${durationMinutes} minutes. Total Cost: ₹${cost}`
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error ending ride:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
