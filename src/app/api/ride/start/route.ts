import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { startStationId } = await req.json()

    if (!startStationId) {
      return NextResponse.json({ message: "Start station ID is required" }, { status: 400 })
    }

    // Check if user already has an active ride
    const existingRide = await prisma.ride.findFirst({
      where: {
        // @ts-ignore
        userId: session.user.id,
        status: "ACTIVE"
      }
    })

    if (existingRide) {
      return NextResponse.json(
        { message: "You already have an active ride", rideId: existingRide.id },
        { status: 400 }
      )
    }

    // Find an available bike at the start station
    const availableBike = await prisma.bike.findFirst({
      where: {
        stationId: startStationId,
        status: "AVAILABLE"
      }
    })

    if (!availableBike) {
      return NextResponse.json({ message: "No bikes available at this station" }, { status: 404 })
    }

    // Generate a 4-digit OTP for unlocking
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString()

    // Create the ride
    const ride = await prisma.ride.create({
      data: {
        // @ts-ignore
        userId: session.user.id,
        bikeId: availableBike.id,
        startStationId: startStationId,
        otpCode: otpCode,
        status: "ACTIVE"
      }
    })

    // Update bike status
    await prisma.bike.update({
      where: { id: availableBike.id },
      data: { status: "IN_USE" }
    })

    return NextResponse.json(
      { message: "Ride started successfully", rideId: ride.id, otpCode },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error starting ride:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
