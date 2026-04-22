// =========================================================
// CONFIGURACIÓN DE FIREBASE
// =========================================================
// INSTRUCCIONES:
// 1. Ve a https://console.firebase.google.com
// 2. Crea un proyecto nuevo (ej: "negociodia")
// 3. Añade una app Web (icono </>) y copia la config aquí abajo
// 4. Activa Authentication → Email/Password (o Google)
// 5. Activa Firestore Database → modo producción (Europa)
// 6. En Firestore reglas, pega las reglas del final de este archivo
// =========================================================

import { initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirestore, collection, doc, setDoc, deleteDoc,
         onSnapshot, query, where, serverTimestamp } from 'firebase/firestore'

// 👇 REEMPLAZA ESTO con tu config de Firebase Console
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAeMMXcL07RAfAwJ7UdBBS9LmXfeT8j2Xc",
  authDomain: "apptareas-9a38b.firebaseapp.com",
  projectId: "apptareas-9a38b",
  storageBucket: "apptareas-9a38b.firebasestorage.app",
  messagingSenderId: "590609662996",
  appId: "1:590609662996:web:8593b0f00838655d5f9301"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// Exports para usar en la app
export { onAuthStateChanged, signInWithEmailAndPassword,
         createUserWithEmailAndPassword, signOut,
         collection, doc, setDoc, deleteDoc, onSnapshot, query, where, serverTimestamp }

/* =========================================================
   REGLAS DE SEGURIDAD DE FIRESTORE (copia en Firebase Console)
   =========================================================

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Los usuarios de un mismo workspace comparten datos
    match /workspaces/{workspaceId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.uid in get(/databases/$(database)/documents/workspaces/$(workspaceId)).data.members;
    }
    // El workspace raíz solo se puede leer si eres miembro
    match /workspaces/{workspaceId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.members;
      allow write: if request.auth != null && request.auth.uid in resource.data.members;
      allow create: if request.auth != null;
    }
    // Cada usuario lee/escribe su perfil
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

   =========================================================
   ESTRUCTURA DE DATOS EN FIRESTORE
   =========================================================

   workspaces/{workspaceId}
     - name: "Mi empresa"
     - members: ["uid_tuyo", "uid_alvaro"]
     - createdAt
     tasks/{taskId}      → todas las tareas
     clients/{clientId}  → todos los contactos
     meetings/{meetingId}→ todas las reuniones
     companies/{id}      → tus empresas
     projects/{id}       → tus proyectos

   users/{uid}
     - email, name, color, initial, workspaceId

========================================================= */
