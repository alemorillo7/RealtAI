const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Intentar cargar la key de diferentes lugares
const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
if (!fs.existsSync(keyPath)) {
    console.error("No se encontró serviceAccountKey.json en " + keyPath);
    process.exit(1);
}

const serviceAccount = require(keyPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function initConfig() {
  try {
    const configRef = db.collection('settings').doc('calendar');
    const snap = await configRef.get();

    if (!snap.exists) {
      await configRef.set({
        working_days: [1, 2, 3, 4, 5], // Lunes a Viernes
        start_time: "09:00",
        end_time: "18:00",
        slot_duration: 60, // 1 hora por cita
        timezone: "America/Argentina/Buenos_Aires",
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log("Configuración de calendario inicializada correctamente");
    } else {
      console.log("La configuración de calendario ya existe");
    }
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

initConfig();
