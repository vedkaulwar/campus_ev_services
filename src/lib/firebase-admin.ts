import * as admin from "firebase-admin"

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "⚠️  Firebase Admin: Missing FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, or NEXT_PUBLIC_FIREBASE_PROJECT_ID env vars. " +
      "API routes requiring Firestore will fail at runtime until these are added in your Vercel dashboard."
    )
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey,
        }),
      })
      console.log("✅ Firebase Admin initialized")
    } catch (error) {
      console.error("Firebase admin initialization error:", error)
    }
  }
}

// Export db — will be undefined if admin wasn't initialized
const db = admin.apps.length ? admin.firestore() : null as any

export { admin, db }
