import admin from 'firebase-admin'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.NEXT_FIREBASE_ADMIN_SDK || '{}')
    )
  })
}

export const firestore = admin.firestore()
export const firebaseAuth = admin.auth()
