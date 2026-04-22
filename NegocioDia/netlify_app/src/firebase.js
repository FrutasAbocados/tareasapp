import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, collection, doc, setDoc, deleteDoc,
         onSnapshot, query, where, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAeMMXcL07RAfAwJ7UdBBS9LmXfeT8j2Xc",
  authDomain: "apptareas-9a38b.firebaseapp.com",
  projectId: "apptareas-9a38b",
  storageBucket: "apptareas-9a38b.firebasestorage.app",
  messagingSenderId: "590609662996",
  appId: "1:590609662996:web:8593b0f00838655d5f9301"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

export { onAuthStateChanged, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut,
         collection, doc, setDoc, deleteDoc, onSnapshot, query, where, serverTimestamp }
