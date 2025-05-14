// /src/services/firebaseAuth.ts

import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// inicia o Firebase Admin SDK
if (admin.apps.length === 0) {
  try {
    // tenta utilizar a chave de serviço do Firebase
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || "shelfie-a7668",
    });
  } catch (error) {
    throw new Error('Failed to initialize Firebase Admin SDK');
  }
}

export const getUserFromAuthToken = async (req: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  
  if (!token) {
    return null;
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    return null;
  }
};
