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

    // @ts-ignore
    const userId = session.user.id
    const payload = await req.json()
    const { rideId, amount, razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload

    // If amount > 0, we must have valid razorpay details
    if (Number(amount) > 0) {
      if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
        return NextResponse.json({ message: "Payment verification failed" }, { status: 400 })
      }
    }

    if (!rideId) {
      return NextResponse.json({ message: "Ride ID is required" }, { status: 400 })
    }

    const rideRef = db.collection("rides").doc(rideId)
    const rideDoc = await rideRef.get()

    if (!rideDoc.exists) {
      return NextResponse.json({ message: "Ride not found" }, { status: 404 })
    }

    const ride = rideDoc.data()!

    if (ride.userId !== userId || ride.status !== "AWAITING_PAYMENT") {
      return NextResponse.json({ message: "Invalid ride state for payment" }, { status: 400 })
    }

    // 1. Transition the current ride to PENDING
    await rideRef.update({ 
      status: "PENDING", 
      paidAt: new Date().toISOString() 
    })

    // 2. Clear out any past dues
    const duesSnap = await db.collection("rides")
      .where("userId", "==", userId)
      .where("status", "==", "COMPLETED_WITH_DUES")
      .get()

    const batch = db.batch()
    duesSnap.docs.forEach((doc: any) => {
      batch.update(doc.ref, { 
        status: "COMPLETED_PAID",
        duesClearedAt: new Date().toISOString()
      })
    })

    if (!duesSnap.empty) {
      await batch.commit()
    }

    return NextResponse.json(
      { message: "Payment successful! Scooter is ready to unlock." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error paying base fare:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
