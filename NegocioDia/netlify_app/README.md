# NegocioDía — Guía de despliegue

App PWA instalable para gestión diaria profesional. Tú y Álvaro compartís datos en tiempo real gracias a Firebase.

---

## 📋 Resumen rápido

1. Crear proyecto **Firebase** (5 min) → copiar claves
2. Pegar claves en `src/firebase.js`
3. Subir código a **GitHub**
4. Conectar GitHub a **Netlify** → deploy automático
5. Abrir la URL de Netlify en el móvil → "Añadir a pantalla de inicio"

---

## 🔥 Paso 1 — Crear proyecto Firebase

1. Entra a https://console.firebase.google.com
2. Click en **"Añadir proyecto"** → nombre: `negociodia` (o el que quieras)
3. Puedes desactivar Google Analytics (no lo necesitas)
4. Una vez creado, en la pantalla de inicio del proyecto verás iconos. Click en el icono **`</>`** (Web)
5. Nombre de la app: `negociodia-web` → **registrar app**
6. Firebase te mostrará un bloque de código con `firebaseConfig = { apiKey: "...", ... }` → **cópialo entero**, lo vas a pegar en el siguiente paso

### 1.1 — Activar Authentication
En el menú lateral: **Compilación → Authentication → Comenzar**
- Pestaña **"Método de acceso"** → activa **"Correo electrónico/Contraseña"** → Guardar

### 1.2 — Activar Firestore
En el menú lateral: **Compilación → Firestore Database → Crear base de datos**
- Ubicación: **europe-west1** (Bélgica) o **eur3 (Europa)**
- Empieza en **modo producción**
- Cuando entres en la base, ve a la pestaña **"Reglas"** y pega esto:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

> ⚠ Estas reglas dan acceso a cualquier usuario autenticado. Como solo vosotros dos vais a tener cuentas creadas, es seguro. Si quieres más seguridad, lee la sección "Reglas avanzadas" al final.

Click en **"Publicar"**.

### 1.3 — Crear las cuentas
Vuelve a **Authentication → Usuarios → Añadir usuario** y crea 2 cuentas:
- `tuemail@ejemplo.com` / contraseña
- `alvaro@ejemplo.com` / contraseña

*(O las creáis desde la propia app al primer login, sirve igual)*

---

## 🔑 Paso 2 — Pegar claves en el código

Abre `src/firebase.js` y reemplaza el bloque `firebaseConfig` con el que te dio Firebase:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "negociodia.firebaseapp.com",
  projectId: "negociodia",
  storageBucket: "negociodia.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123...:web:abc..."
}
```

Guarda el archivo.

---

## 🚀 Paso 3 — Subir a GitHub

### Si ya tienes una cuenta GitHub:

```bash
# Dentro de la carpeta del proyecto
git init
git add .
git commit -m "NegocioDía inicial"

# Crea un repositorio en https://github.com/new (privado)
# Luego:
git remote add origin https://github.com/TU_USUARIO/negociodia.git
git branch -M main
git push -u origin main
```

### Si NO quieres líos con git:
Puedes también arrastrar el ZIP directamente en la web de Netlify sin GitHub.
**Saltar al Paso 4b.**

---

## 🌐 Paso 4 — Desplegar en Netlify

### Opción A: con GitHub (recomendada, auto-deploy al actualizar)

1. Entra a https://app.netlify.com → **"Add new site" → "Import an existing project"**
2. Conectar con **GitHub** → autorizar
3. Seleccionar el repo `negociodia`
4. Netlify detecta automáticamente Vite. Los valores serán:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **"Deploy site"**
6. En 1-2 minutos tendrás una URL tipo `https://random-name-123.netlify.app`

### Opción B: sin GitHub (arrastrar carpeta)

1. En local, abre terminal en la carpeta del proyecto y ejecuta:
   ```bash
   npm install
   npm run build
   ```
2. Se crea una carpeta `dist/`
3. Entra a https://app.netlify.com/drop
4. Arrastra la carpeta `dist` entera a la web
5. Tendrás tu URL

### Personalizar el dominio
- En Netlify → Site settings → Change site name → `negociodia`
- Tu URL pasará a `https://negociodia.netlify.app`

---

## 📱 Paso 5 — Instalar en el móvil

### En iPhone (Safari):
1. Abre la URL de Netlify en **Safari** (no Chrome)
2. Toca el botón **"Compartir"** (cuadrado con flecha arriba)
3. Baja y pulsa **"Añadir a pantalla de inicio"**
4. Ya tienes el icono en tu home screen como app nativa

### En Android (Chrome):
1. Abre la URL en Chrome
2. Toca los 3 puntos arriba a la derecha
3. **"Instalar aplicación"** o **"Añadir a pantalla principal"**
4. Aparece el icono como app

Una vez instalada:
- Se abre en pantalla completa (sin barra del navegador)
- Funciona offline (lo que ya habías cargado)
- Se actualiza sola cuando hagas cambios y los subas

---

## 👥 Paso 6 — Uso compartido con Álvaro

1. Le pasas a Álvaro la URL de Netlify
2. Él entra, se registra con su email/contraseña
3. Ve exactamente los mismos datos que tú (todo sincronizado en tiempo real)
4. Cada uno pulsa su avatar arriba → cambia a su perfil (Tú / Álvaro)
5. Las tareas que cree cada uno quedan asignadas automáticamente a su perfil, pero ambos veis todo

---

## 🔧 Desarrollo local (opcional)

Si quieres probar cambios antes de subirlos:

```bash
npm install
npm run dev
```

Se abre en http://localhost:5173

---

## 🛡 Reglas Firestore avanzadas (opcional, más seguras)

Si quieres restringir el acceso solo a vuestros 2 UIDs específicos:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /workspaces/{workspaceId}/{document=**} {
      allow read, write: if request.auth != null
        && request.auth.uid in [
          'UID_TUYO',
          'UID_ALVARO'
        ];
    }
  }
}
```

Los UIDs los ves en **Authentication → Usuarios** de Firebase.

---

## ❓ Problemas típicos

**"Firebase: Error (auth/invalid-api-key)"**
→ No has pegado bien las claves en `firebase.js`. Revisa que copiaste TODA la config.

**El login funciona pero no veo datos**
→ Revisa que activaste Firestore Database (no Realtime Database, que es otro producto).

**La app no aparece como instalable en el móvil**
→ Debe estar servida en HTTPS. Netlify lo hace automáticamente. Si entras por la IP local, no funcionará.

**Quiero resetear todos los datos**
→ En Firebase Console → Firestore → borra la colección `workspaces/main`. La próxima vez que alguien entre, se sembrarán los datos de ejemplo otra vez.

---

## 📦 Estructura del proyecto

```
negociodia/
├── src/
│   ├── App.jsx           ← Toda la app
│   ├── firebase.js       ← Config Firebase (edita aquí)
│   ├── main.jsx
│   └── index.css
├── public/
│   ├── favicon.svg
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── index.html
├── package.json
├── vite.config.js        ← PWA configurado aquí
├── netlify.toml          ← Deploy config
└── README.md
```

---

Hecho con cariño. Si algo falla, mira en la consola del navegador (F12) — Firebase suele dar mensajes claros.
