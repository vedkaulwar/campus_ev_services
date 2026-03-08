import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { db } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    const { name, age, collegeId, email, password, contactNo } = await req.json()

    if (!name || !age || !collegeId || !email || !password || !contactNo) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    // Check if user already exists by email or collegeId
    const emailSnap = await db.collection("users").where("email", "==", email).limit(1).get()
    const idSnap = await db.collection("users").where("collegeId", "==", collegeId).limit(1).get()

    if (!emailSnap.empty || !idSnap.empty) {
      return NextResponse.json(
        { message: "User with this email or college ID already exists" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUserRef = await db.collection("users").add({
      name,
      age: parseInt(age),
      collegeId,
      email,
      password: hashedPassword,
      contactNo,
      createdAt: new Date().toISOString(),
    })

    return NextResponse.json(
      { message: "User registered successfully", user: { id: newUserRef.id, email } },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
