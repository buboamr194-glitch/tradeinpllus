// ─── Seed script: migrate current static data to Firestore ───
// Run once from browser console to populate the database

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js';
import {
  getFirestore, collection, doc, setDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Stores data (from index.html) ───
const stores = [
  {
    id: 'store-main',
    name: 'tradeinplus',
    nameAr: 'الفرع الرئيسي',
    badge: 'الفرع الرئيسي',
    address: 'صف جامع حاتم، شارع المعهد الديني',
    city: 'الإسكندرية',
    phone: '+201112214212',
    hours: '10 AM – 12 PM',
    lat: 31.2125,
    lng: 29.946889,
    active: true
  },
  {
    id: 'store-tradein',
    name: 'Trade In',
    nameAr: 'فرع Trade In',
    badge: 'فرع',
    address: 'شارع المستشار محمود العطار',
    city: 'الإسكندرية',
    phone: '+201112214212',
    hours: '10 AM – 12 PM',
    lat: 31.212476,
    lng: 29.946168,
    active: true
  },
  {
    id: 'store-accessories',
    name: 'Momen Mobile Store',
    nameAr: 'فرع الاكسسوار',
    badge: 'فرع الاكسسوار',
    address: 'شارع المستشار محمود العطار',
    city: 'الإسكندرية',
    phone: '+201112214212',
    hours: '10 AM – 12 PM',
    lat: 31.212476,
    lng: 29.946168,
    active: true
  }
];

// ─── Seed function ───
export async function seedStores() {
  console.log('Seeding stores...');
  for (const store of stores) {
    const { id, ...data } = store;
    await setDoc(doc(db, 'stores', id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`  ✓ ${store.name}`);
  }
  console.log('Done! Stores seeded.');
}

// Run: import this file in browser console and call seedStores()
