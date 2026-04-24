import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/firebase-admin"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // @ts-ignore
    const userId = session.user.id
    const payload = await req.json()
    const { type, id, amount: requestedAmount } = payload

    let amount = 0

    if (type === "PASS") {
      if (id === "DAILY") amount = 50
      else if (id === "WEEKLY") amount = 200
      else if (id === "MONTHLY") amount = 500
      else return NextResponse.json({ message: "Invalid pass type" }, { status: 400 })
    } else if (type === "RIDE") {
      const rideDoc = await db.collection("rides").doc(id).get()
      if (!rideDoc.exists) {
        return NextResponse.json({ message: "Ride not found" }, { status: 404 })
      }
      const ride = rideDoc.data()!
      if (ride.userId !== userId || ride.status !== "AWAITING_PAYMENT") {
        return NextResponse.json({ message: "Invalid ride state" }, { status: 400 })
      }
      // For rides, the frontend calculates total dues + base.
      // We will trust the requestedAmount as a fallback, but in prod we should verify dues.
      amount = Number(requestedAmount) || 0
      
      if (amount <= 0) {
        return NextResponse.json({ message: "Amount must be strictly positive for razorpay order" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ message: "Invalid type" }, { status: 400 })
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay operates in paise
      currency: "INR",
      receipt: `rcpt_${Date.now()}_${userId.substring(0, 5)}`
    }

    const order = await razorpay.orders.create(options)
    
    return NextResponse.json({ orderId: order.id, amount: options.amount }, { status: 200 })

  } catch (err: any) {
    console.error("Razorpay Order Error:", err)
    return NextResponse.json({ message: err.message || "Internal Server Error" }, { status: 500 })
  }
}

