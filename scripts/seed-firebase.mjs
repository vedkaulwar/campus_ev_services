// Script to seed Firebase Firestore with the 6 campus stations and initial bikes
// Run with: node scripts/seed-firebase.mjs

import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, getDocs, deleteDoc } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyARNv7PuM-TrW1a4ynnomM6E4qHYkmoZrk",
  authDomain: "campusev-4a9a0.firebaseapp.com",
  projectId: "campusev-4a9a0",
  storageBucket: "campusev-4a9a0.firebasestorage.app",
  messagingSenderId: "185586453287",
  appId: "1:185586453287:web:c60dc93e87943ec8ec7702",
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

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
  console.log("🌱 Seeding Firestore with campus stations...\n")

  // Clear existing stations
  const existingSnap = await getDocs(collection(db, "stations"))
  for (const doc of existingSnap.docs) {
    await deleteDoc(doc.ref)
  }
  console.log("✅ Cleared old stations")

  // Add new stations
  for (const station of stations) {
    const ref = await addDoc(collection(db, "stations"), station)
    console.log(`📍 Added: ${station.name} (${station.bikes.length} bikes) → ID: ${ref.id}`)
  }

  console.log("\n🎉 Seeding complete! Your Firebase console should now show 6 stations.")
  process.exit(0)
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err)
  process.exit(1)
})
