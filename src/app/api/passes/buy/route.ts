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

    const { type } = await req.json() // "DAILY", "WEEKLY", "MONTHLY"

    if (!["DAILY", "WEEKLY", "MONTHLY"].includes(type)) {
      return NextResponse.json({ message: "Invalid pass type" }, { status: 400 })
    }

    // @ts-ignore
    const userId = session.user.id

    // Check if user already has an active pass
    const now = new Date()
    const passSnap = await db.collection("passes")
      .where("userId", "==", userId)
      .where("expiresAt", ">", now.toISOString())
      .limit(1).get()

    if (!passSnap.empty) {
      return NextResponse.json({ message: "You already have an active pass!" }, { status: 400 })
    }

    // Calculate expiration date
    let expiresAt = new Date()
    if (type === "DAILY") expiresAt.setDate(now.getDate() + 1)
    else if (type === "WEEKLY") expiresAt.setDate(now.getDate() + 7)
    else if (type === "MONTHLY") expiresAt.setMonth(now.getMonth() + 1)

    const newPassRef = await db.collection("passes").add({
      userId,
      type,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
    })

    return NextResponse.json(
      { message: "Pass purchased successfully!", pass: { id: newPassRef.id, type, expiresAt } },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error purchasing pass:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
