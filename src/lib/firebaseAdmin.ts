import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    
    if (serviceAccountStr) {
      // Clean the string from potential surrounding quotes or spaces added by Vercel/env imports
      serviceAccountStr = serviceAccountStr.trim();
      if ((serviceAccountStr.startsWith("'") && serviceAccountStr.endsWith("'")) || 
          (serviceAccountStr.startsWith('"') && serviceAccountStr.endsWith('"'))) {
        serviceAccountStr = serviceAccountStr.slice(1, -1);
      }

      let serviceAccount;
      
      try {
        // 1. Try to see if it's Base64 encoded
        if (!serviceAccountStr.startsWith('{')) {
          const decoded = Buffer.from(serviceAccountStr, 'base64').toString('utf-8').trim();
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
      } catch (parseError: any) {
        console.error('Error parsing service account key:', parseError.message);
        console.error('String length:', serviceAccountStr.length);
        console.error('Starts with:', serviceAccountStr.substring(0, 10));
        console.error('Ends with:', serviceAccountStr.substring(serviceAccountStr.length - 10));
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
