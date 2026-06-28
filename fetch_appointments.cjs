const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(require('./firebase.json'))
});

const db = admin.firestore();

async function sanitizeDurations() {
  const snap = await db.collection('appointments').get();
  let fixed = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const rawDuration = data.duration;
    const parsed = Number(rawDuration);
    const valid = !Number.isNaN(parsed) && Number.isFinite(parsed) && parsed >= 1 && parsed <= 720;

    if (!valid) {
      const safeDuration = Math.max(1, Math.min(720, parsed || 60));
      console.log(`Fixing ${doc.id}: duration was ${JSON.stringify(rawDuration)} → ${safeDuration}`);
      await db.collection('appointments').doc(doc.id).update({ duration: safeDuration });
      fixed++;
    }
  }

  console.log(`Done. Fixed ${fixed} appointments.`);
}

sanitizeDurations().catch(console.error);
