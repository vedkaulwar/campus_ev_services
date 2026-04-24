import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/firebase-admin"
import { verifyRazorpaySignature } from "@/lib/razorpay"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const payload = await req.json()
    const { type, razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload // type: "DAILY", "WEEKLY", "MONTHLY"

    if (!["DAILY", "WEEKLY", "MONTHLY"].includes(type)) {
      return NextResponse.json({ message: "Invalid pass type" }, { status: 400 })
    }

    if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ message: "Payment verification failed" }, { status: 400 })
    }

    // @ts-ignore
    const userId = session.user.id


    // Check if user already has an active pass
    const now = new Date()
    const nowISO = now.toISOString()
    const passSnap = await db.collection("passes")
      .where("userId", "==", userId)
      .get()

    const hasActivePass = passSnap.docs.some((doc: any) => doc.data().expiresAt > nowISO)

    if (hasActivePass) {
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
