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
      { id: "bike-mg-4", status: "AVAILABLE", battery: 85 },
      { id: "bike-mg-5", status: "AVAILABLE", battery: 92 },
    ]
  },
  {
    name: "Food Tech / Mandir",
    latitude: 18.4831,
    longitude: 74.0145,
    bikes: [
      { id: "bike-ft-1", status: "AVAILABLE", battery: 90 },
      { id: "bike-ft-2", status: "AVAILABLE", battery: 75 },
      { id: "bike-ft-3", status: "AVAILABLE", battery: 88 },
      { id: "bike-ft-4", status: "AVAILABLE", battery: 65 },
      { id: "bike-ft-5", status: "AVAILABLE", battery: 98 },
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
      { id: "bike-it-4", status: "AVAILABLE", battery: 77 },
      { id: "bike-it-5", status: "AVAILABLE", battery: 89 },
    ]
  },
  {
    name: "IOD / Bioengineering",
    latitude: 18.4820,
    longitude: 74.0160,
    bikes: [
      { id: "bike-iod-1", status: "AVAILABLE", battery: 88 },
      { id: "bike-iod-2", status: "AVAILABLE", battery: 72 },
      { id: "bike-iod-3", status: "AVAILABLE", battery: 95 },
      { id: "bike-iod-4", status: "AVAILABLE", battery: 68 },
      { id: "bike-iod-5", status: "AVAILABLE", battery: 82 },
    ]
  },
  {
    name: "Raj Mess",
    latitude: 18.4850,
    longitude: 74.0140,
    bikes: [
      { id: "bike-rm-1", status: "AVAILABLE", battery: 95 },
      { id: "bike-rm-2", status: "AVAILABLE", battery: 83 },
      { id: "bike-rm-3", status: "AVAILABLE", battery: 78 },
      { id: "bike-rm-4", status: "AVAILABLE", battery: 91 },
      { id: "bike-rm-5", status: "AVAILABLE", battery: 86 },
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
      { id: "bike-sc-4", status: "AVAILABLE", battery: 84 },
      { id: "bike-sc-5", status: "AVAILABLE", battery: 97 },
    ]
  }
]

async function seed() {
  console.log("🌱 Seeding Firebase Firestore with campus stations...\n")

  // Clear existing stations
  const stationsSnap = await db.collection("stations").get()
  for (const doc of stationsSnap.docs) {
    await doc.ref.delete()
  }
  console.log(`✅ Cleared ${stationsSnap.size} existing station(s)`)

  // Clear existing rides (prevent stale "active ride" blocks)
  const ridesSnap = await db.collection("rides").get()
  for (const doc of ridesSnap.docs) {
    await doc.ref.delete()
  }
  console.log(`✅ Cleared ${ridesSnap.size} existing ride(s)`)

  // Clear existing passes (optional, but good for a full reset)
  const passesSnap = await db.collection("passes").get()
  for (const doc of passesSnap.docs) {
    await doc.ref.delete()
  }
  console.log(`✅ Cleared ${passesSnap.size} existing pass(es)\n`)

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
