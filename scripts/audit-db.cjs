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

async function audit() {
  console.log("--- Users Audit ---");
  const usersSnap = await db.collection("users").get();
  usersSnap.docs.forEach(doc => {
    console.log(`User: ${doc.data().email}, ID: ${doc.id}`);
  });

  console.log("\n--- Rides Audit ---");
  const ridesSnap = await db.collection("rides").get();
  console.log(`Total Rides: ${ridesSnap.size}`);
  ridesSnap.docs.forEach(doc => {
    console.log(`Ride: ${doc.id}, UserID: ${doc.data().userId}, Status: ${doc.data().status}`);
  });
  
  process.exit(0);
}

audit();
