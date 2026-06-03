// ─── Firestore helpers for tradeinplus ───
// Handles: products, stores, orders

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js';
import {
  getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  query, orderBy, where, onSnapshot, serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js';

// Initialize
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ─── Collections ───
const PRODUCTS = 'products';
const STORES   = 'stores';
const ORDERS   = 'orders';

// ─── Products ───
export async function getProducts() {
  const snap = await getDocs(query(collection(db, PRODUCTS), orderBy('sortOrder')));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getProduct(id) {
  const snap = await getDoc(doc(db, PRODUCTS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateProduct(id, data) {
  await updateDoc(doc(db, PRODUCTS, id), { ...data, updatedAt: serverTimestamp() });
}

export async function addProduct(data) {
  return await addDoc(collection(db, PRODUCTS), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function deleteProduct(id) {
  await deleteDoc(doc(db, PRODUCTS, id));
}

// ─── Stores ───
export async function getStores() {
  const snap = await getDocs(collection(db, STORES));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateStore(id, data) {
  await updateDoc(doc(db, STORES, id), { ...data, updatedAt: serverTimestamp() });
}

// ─── Orders ───
export async function createOrder(orderData) {
  const order = {
    ...orderData,
    status: 'new',            // new → processing → shipped → delivered
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    orderNumber: 'ORD-' + Date.now().toString(36).toUpperCase()
  };
  const ref = await addDoc(collection(db, ORDERS), order);
  return { id: ref.id, ...order };
}

export async function getOrders(statusFilter) {
  let q;
  if (statusFilter && statusFilter !== 'all') {
    q = query(collection(db, ORDERS), where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
  } else {
    q = query(collection(db, ORDERS), orderBy('createdAt', 'desc'));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateOrderStatus(id, status) {
  await updateDoc(doc(db, ORDERS, id), { status, updatedAt: serverTimestamp() });
}

export async function getOrder(id) {
  const snap = await getDoc(doc(db, ORDERS, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── Real-time listener for new orders ───
export function onNewOrders(callback) {
  const q = query(collection(db, ORDERS), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        callback({ id: change.doc.id, ...change.doc.data() });
      }
    });
  });
}

export { db, serverTimestamp, Timestamp };
