import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/firebase-admin"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // @ts-ignore
    const userId = session.user.id
    const now = new Date()

    const passSnap = await db.collection("passes")
      .where("userId", "==", userId)
      .where("expiresAt", ">", now.toISOString())
      .limit(1).get()

    if (!passSnap.empty) {
      const pass = passSnap.docs[0].data()
      return NextResponse.json({ hasPass: true, passType: pass.type }, { status: 200 })
    }

    return NextResponse.json({ hasPass: false }, { status: 200 })
  } catch (error) {
    console.error("Error checking active pass:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
