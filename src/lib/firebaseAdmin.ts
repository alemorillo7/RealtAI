import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountStr) {
      // Parse if it's a JSON string, otherwise handle string literals
      const serviceAccount = JSON.parse(serviceAccountStr);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault()
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
