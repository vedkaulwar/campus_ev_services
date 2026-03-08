import { NextResponse } from "next/server"
export const dynamic = 'force-dynamic'
import { db } from "@/lib/firebase-admin"

export async function GET() {
  try {
    const stationsSnap = await db.collection("stations").orderBy("name").get()

    const stations = stationsSnap.docs.map((doc: any) => {
      const data = doc.data()
      const availableBikes = (data.bikes || []).filter((b: any) => b.status === "AVAILABLE")
      return {
        id: doc.id,
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        bikes: availableBikes
      }
    })

    return NextResponse.json(stations)
  } catch (error) {
    console.error("Error fetching stations:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
