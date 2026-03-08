// Seed script for Firebase Firestore using CommonJS (compatible with firebase-admin)
// Run with: node scripts/seed-firebase-admin.cjs

const admin = require("firebase-admin")
const { readFileSync } = require("fs")

let serviceAccount
try {
  serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"))
} catch (err) {
  console.error("❌ ERROR: Could not find 'serviceAccountKey.json' in the project root.")
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

const stations = [
  {
    name: "MIT-ADT Main Gate",
    latitude: 18.4824,
    longitude: 74.0128,
    bikes: [
      { id: "bike-mg-1", status: "AVAILABLE", battery: 95 },
      { id: "bike-mg-2", status: "AVAILABLE", battery: 80 },
      { id: "bike-mg-3", status: "AVAILABLE", battery: 70 },
    ]
  },
  {
    name: "Food Tech / Mandir",
    latitude: 18.4831,
    longitude: 74.0145,
    bikes: [
      { id: "bike-ft-1", status: "AVAILABLE", battery: 90 },
      { id: "bike-ft-2", status: "AVAILABLE", battery: 75 },
    ]
  },
  {
    name: "IT Building",
    latitude: 18.4840,
    longitude: 74.0152,
    bikes: [
      { id: "bike-it-1", status: "AVAILABLE", battery: 85 },
      { id: "bike-it-2", status: "AVAILABLE", battery: 60 },
      { id: "bike-it-3", status: "AVAILABLE", battery: 92 },
    ]
  },
  {
    name: "IOD / Bioengineering",
    latitude: 18.4820,
    longitude: 74.0160,
    bikes: [
      { id: "bike-iod-1", status: "AVAILABLE", battery: 88 },
      { id: "bike-iod-2", status: "AVAILABLE", battery: 72 },
    ]
  },
  {
    name: "Raj Mess",
    latitude: 18.4850,
    longitude: 74.0140,
    bikes: [
      { id: "bike-rm-1", status: "AVAILABLE", battery: 95 },
      { id: "bike-rm-2", status: "AVAILABLE", battery: 83 },
    ]
  },
  {
    name: "Sports Complex",
    latitude: 18.4860,
    longitude: 74.0130,
    bikes: [
      { id: "bike-sc-1", status: "AVAILABLE", battery: 79 },
      { id: "bike-sc-2", status: "AVAILABLE", battery: 91 },
      { id: "bike-sc-3", status: "AVAILABLE", battery: 65 },
    ]
  }
]

async function seed() {
  console.log("🌱 Seeding Firebase Firestore with campus stations...\n")

  // Clear existing stations
  const snap = await db.collection("stations").get()
  for (const doc of snap.docs) {
    await doc.ref.delete()
  }
  console.log(`✅ Cleared ${snap.size} existing station(s)\n`)

  // Add all stations
  for (const station of stations) {
    const ref = await db.collection("stations").add(station)
    console.log(`📍 ${station.name} → ${station.bikes.length} bikes → ID: ${ref.id}`)
  }

  console.log("\n🎉 Done! Your Firebase Firestore now has all 6 campus stations.")
  process.exit(0)
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err.message)
  process.exit(1)
})
