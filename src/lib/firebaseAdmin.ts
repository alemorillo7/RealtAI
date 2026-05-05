import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountStr) {
      let serviceAccount;
      
      try {
        // 1. Try to see if it's Base64 encoded (recommended for Vercel)
        if (!serviceAccountStr.startsWith('{')) {
          const decoded = Buffer.from(serviceAccountStr, 'base64').toString('utf-8');
          serviceAccount = JSON.parse(decoded);
        } else {
          // 2. Normal JSON string
          serviceAccount = JSON.parse(serviceAccountStr);
        }

        // Fix for Vercel environment variables escaping \n
        if (serviceAccount.private_key) {
          serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }

        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
        });
      } catch (parseError) {
        console.error('Error parsing service account key:', parseError);
        // Fallback or more robust parsing could go here
      }
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
