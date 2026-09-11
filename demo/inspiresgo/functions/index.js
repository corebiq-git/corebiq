
const { onSchedule, onRequest } = require("firebase-functions/v2/scheduler");
const { getStorage } = require("firebase-admin/storage");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { initializeApp } = require("firebase-admin/app");
const functions = require("firebase-functions");

initializeApp();

const allowedPermissions = ["packages","bookings","customers","drivers","expenses","backup"];

async function verifyAdmin(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) throw new Error("Missing auth token");
  const token = header.substring(7);
  const decoded = await getAuth().verifyIdToken(token);
  const profile = await getFirestore().doc(`users/${decoded.uid}`).get();
  if (!profile.exists || profile.data().role !== "admin") throw new Error("Admin access required");
  return decoded;
}

/**
 * Admin-only staff creator.
 * POST /api/createStaff
 * Body: {name,email,password,permissions,status}
 */
exports.createStaff = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).send("POST required");

  try {
    await verifyAdmin(req);
    const {name,email,password,permissions,status} = req.body || {};
    if (!name || !email || !password || String(password).length < 6) return res.status(400).send("Name, email and password (6+ chars) are required");
    const cleanPermissions = Object.fromEntries(allowedPermissions.map(k => [k, permissions?.[k] === true]));
    const user = await getAuth().createUser({email:String(email).trim(),password:String(password),displayName:String(name).trim()});
    await getAuth().setCustomUserClaims(user.uid,{role:"staff"});
    await getFirestore().doc(`users/${user.uid}`).set({
      name:String(name).trim(),email:user.email,role:"staff",status:status==="disabled"?"disabled":"active",
      permissions:cleanPermissions,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()
    });
    return res.json({uid:user.uid,email:user.email});
  } catch (e) {
    console.error(e);
    return res.status(403).send(e.message || "Unable to create staff");
  }
});

/**
 * Optional scheduled Firestore backup to Cloud Storage.
 */
exports.scheduledFirestoreBackup = onSchedule("every 24 hours", async () => {
  const db = getFirestore();
  const bucket = getStorage().bucket(process.env.BACKUP_BUCKET);
  const names = ["packages","bookings","customers","drivers","expenses"];
  const result = {exportedAt:new Date().toISOString(),collections:{}};
  for (const name of names) {
    const snap = await db.collection(name).get();
    result.collections[name] = snap.docs.map(d => ({id:d.id,...d.data()}));
  }
  const fileName = `travells-backups/${new Date().toISOString().replace(/[:.]/g,"-")}.json`;
  await bucket.file(fileName).save(JSON.stringify(result,null,2),{contentType:"application/json",metadata:{cacheControl:"private, max-age=0"}});
  console.log(`Backup written to ${fileName}`);
});
