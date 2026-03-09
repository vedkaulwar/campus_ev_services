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

    const duesSnap = await db.collection("rides")
      .where("userId", "==", userId)
      .where("status", "==", "COMPLETED_WITH_DUES")
      .get()

    let totalDues = 0
    duesSnap.docs.forEach((doc: any) => {
      totalDues += doc.data().extraFare || 0
    })

    return NextResponse.json({ totalDues }, { status: 200 })
  } catch (error) {
    console.error("Error fetching dues:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
