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
    const { startStationId, planDuration } = await req.json()

    if (!startStationId) {
      return NextResponse.json({ message: "Start station ID is required" }, { status: 400 })
    }

    const duration = planDuration ? parseInt(planDuration) : 5

    // Check if user already has an active or pending ride
    const rideSnap = await db.collection("rides")
      .where("userId", "==", userId)
      .where("status", "in", ["ACTIVE", "PENDING"])
      .limit(1).get()

    if (!rideSnap.empty) {
      return NextResponse.json(
        { message: "You already have an active or pending ride", rideId: rideSnap.docs[0].id },
        { status: 400 }
      )
    }

    // Get station and find an available bike
    const stationRef = db.collection("stations").doc(startStationId)
    const stationDoc = await stationRef.get()

    if (!stationDoc.exists) {
      return NextResponse.json({ message: "Station not found" }, { status: 404 })
    }

    const stationData = stationDoc.data()!
    const bikes: any[] = stationData.bikes || []
    const availableBikeIndex = bikes.findIndex(b => b.status === "AVAILABLE")

    if (availableBikeIndex === -1) {
      return NextResponse.json({ message: "No bikes available at this station" }, { status: 404 })
    }

    const availableBike = bikes[availableBikeIndex]

    // Create the ride in PENDING state
    const rideRef = await db.collection("rides").add({
      userId,
      bikeId: availableBike.id,
      startStationId,
      planDuration: duration,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    })

    // Mark the bike as IN_USE in the station document
    bikes[availableBikeIndex].status = "IN_USE"
    await stationRef.update({ bikes })

    return NextResponse.json(
      { message: "Bike reserved successfully", rideId: rideRef.id, planDuration: duration },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error booking ride:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
