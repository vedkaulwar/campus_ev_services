const admin = require("firebase-admin");
const { readFileSync } = require("fs");

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf8"));
} catch (err) {
  console.error("❌ ERROR: Could not find 'serviceAccountKey.json'");
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function check() {
  const ridesSnap = await db.collection("rides").get();
  console.log(`Current rides in DB: ${ridesSnap.size}`);
  ridesSnap.docs.forEach(doc => {
    console.log(`- Ride ID: ${doc.id}, User: ${doc.data().userId}, Status: ${doc.data().status}`);
  });
  process.exit(0);
}

check();
