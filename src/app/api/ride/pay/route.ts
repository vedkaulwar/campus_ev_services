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
    const { rideId } = await req.json()

    if (!rideId) {
      return NextResponse.json({ message: "Ride ID is required" }, { status: 400 })
    }

    const rideRef = db.collection("rides").doc(rideId)
    const rideDoc = await rideRef.get()

    if (!rideDoc.exists) {
      return NextResponse.json({ message: "Completed ride not found" }, { status: 404 })
    }

    const ride = rideDoc.data()!

    if (ride.userId !== userId || ride.status !== "COMPLETED") {
      return NextResponse.json({ message: "Completed ride not found" }, { status: 404 })
    }

    await rideRef.update({ status: "PAID", paidAt: new Date().toISOString() })

    return NextResponse.json(
      { message: "Payment successful!" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error paying for ride:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
