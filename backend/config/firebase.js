const admin = require('firebase-admin');

let firebaseInitialized = false;

const initFirebase = () => {
  if (firebaseInitialized) return;
  
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('Firebase Admin initialized successfully');
    } else {
      console.log('Firebase service account not configured - OTP will run in dev mode');
    }
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
  }
};

const verifyFirebaseToken = async (idToken) => {
  if (!firebaseInitialized) {
    return null;
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase token verification error:', error.message);
    return null;
  }
};

module.exports = { initFirebase, verifyFirebaseToken, admin };
