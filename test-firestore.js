import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function check() {
  console.log('Fetching submissions...');
  try {
    const snap = await getDocs(collection(db, 'submissions'));
    console.log(`Found ${snap.size} submissions.`);
    snap.forEach(doc => {
      console.log(doc.id, '=>', doc.data());
    });
  } catch (err) {
    console.error('Error fetching:', err);
  }
  process.exit(0);
}

check().catch(console.error);
