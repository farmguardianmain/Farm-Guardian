import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdK8m4zqxFEbC2Jvv7fTitEyaJ056DhvQznBCzgXgZYi5rRBZhx",
  authDomain: "farm-guardian-bb535.firebaseapp.com",
  projectId: "farm-guardian-bb535",
  storageBucket: "farm-guardian-bb535.appspot.com",
  messagingSenderId: "103435693592766539996",
  appId: "1:103435693592766539996:web:7c587ccd0a"
};

// TO GET YOUR CONFIG:
// 1. Go to https://console.firebase.google.com
// 2. Select your project
// 3. Go to Project Settings → General → Your apps
// 4. Click Web app icon and copy the config

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };

// Firebase service functions
export class FirebaseService {
  static async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error getting document:', error);
      return null;
    }
  }

  static async getCollection(collectionName) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error getting collection:', error);
      return [];
    }
  }

  static async createDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await setDoc(docRef, data);
      return true;
    } catch (error) {
      console.error('Error creating document:', error);
      return false;
    }
  }

  static async updateDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, data);
      return true;
    } catch (error) {
      console.error('Error updating document:', error);
      return false;
    }
  }

  static async deleteDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  }

  static async queryDocuments(collectionName, field, operator, value) {
    try {
      const q = query(collection(db, collectionName), where(field, operator, value));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error querying documents:', error);
      return [];
    }
  }

  static subscribeToCollection(collectionName, callback, orderByField = 'timestamp', limitCount = 50) {
    try {
      const q = query(
        collection(db, collectionName),
        orderBy(orderByField, 'desc'),
        limit(limitCount)
      );
      
      return onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      });
    } catch (error) {
      console.error('Error subscribing to collection:', error);
      return null;
    }
  }

  static subscribeToDocument(collectionName, docId, callback) {
    try {
      const docRef = doc(db, collectionName, docId);
      return onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          callback({ id: docSnap.id, ...docSnap.data() });
        } else {
          callback(null);
        }
      });
    } catch (error) {
      console.error('Error subscribing to document:', error);
      return null;
    }
  }

  static subscribeToQuery(collectionName, constraints, callback) {
    try {
      const q = query(collection(db, collectionName), ...constraints);
      return onSnapshot(q, (querySnapshot) => {
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        callback(data);
      });
    } catch (error) {
      console.error('Error subscribing to query:', error);
      return null;
    }
  }
}

export default FirebaseService;
