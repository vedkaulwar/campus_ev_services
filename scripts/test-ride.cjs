const admin = require("firebase-admin");
const { readFileSync } = require("fs");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));
} catch (err) {
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function testBooking() {
  const usersSnap = await db.collection("users").limit(1).get();
  if (usersSnap.empty) {
    console.log("No users in db");
    return;
  }
  const userId = usersSnap.docs[0].id;
  
  const stationsSnap = await db.collection("stations").limit(1).get();
  if (stationsSnap.empty) {
    console.log("No stations in db");
    return;
  }
  const station = stationsSnap.docs[0];
  
  // Find a pending ride for user
  const rideSnap = await db.collection("rides")
       .where("userId", "==", userId)
       .where("status", "in", ["PENDING", "ACTIVE"])
       .limit(1).get();
       
  console.log("Current active/pending rides:", rideSnap.size);
  if (!rideSnap.empty) {
      console.log(rideSnap.docs[0].data());
  }
  process.exit(0);
}

testBooking();
