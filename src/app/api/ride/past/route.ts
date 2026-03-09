import { NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
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

    const ridesSnap = await db.collection("rides")
      .where("userId", "==", userId)
      .get()

    const validStatuses = ["COMPLETED", "COMPLETED_WITH_DUES", "COMPLETED_PAID", "PAID"]
    const filteredRides = ridesSnap.docs
      .filter((doc: any) => validStatuses.includes(doc.data().status))
      .sort((a: any, b: any) => new Date(b.data().createdAt).getTime() - new Date(a.data().createdAt).getTime())
      .slice(0, 10)

    const pastRides = await Promise.all(filteredRides.map(async (doc: any) => {
      const data = doc.data()
      
      // Try to resolve station names safely
      let startStationName = "Unknown Station"
      let endStationName = "Unknown Station"
      
      try {
        if (data.startStationId) {
          const s1 = await db.collection("stations").doc(data.startStationId).get()
          if (s1.exists) startStationName = s1.data()!.name
        }
        if (data.endStationId) {
          const s2 = await db.collection("stations").doc(data.endStationId).get()
          if (s2.exists) endStationName = s2.data()!.name
        }
      } catch (e) {
        // Fallback names if lookup fails
      }
      
      return {
        id: doc.id,
        startStation: startStationName,
        endStation: endStationName,
        planDuration: data.planDuration,
        status: data.status,
        extraFare: data.extraFare || 0,
        createdAt: data.createdAt,
        endTime: data.endTime,
      }
    }))

    return NextResponse.json({ pastRides }, { status: 200 })
  } catch (error) {
    console.error("Error fetching past rides:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
