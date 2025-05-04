#!/usr/bin/env node
const admin = require('firebase-admin');
const path  = require('path');

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, 'serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(require(keyPath))
});

const db = admin.firestore();

(async () => {
  try {
    const outfitsSnap = await db.collection('outfits').get();
    console.log(`Found ${outfitsSnap.size} outfits.`);

    const BATCH_SIZE = 250;
    let batch = db.batch(), count = 0;

    for (const docSnap of outfitsSnap.docs) {
      batch.set(docSnap.ref, {
        likesCount:    docSnap.get('likesCount')    || 0,
        commentsCount: docSnap.get('commentsCount') || 0
      }, { merge: true });
      count++;

      if (count % BATCH_SIZE === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }

    if (count % BATCH_SIZE !== 0) {
      await batch.commit();
    }

    console.log('✅ Initialized all counters.');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
})();
