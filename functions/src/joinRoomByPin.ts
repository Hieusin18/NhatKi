import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const joinRoomByPin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Cần đăng nhập.');
  }
  const uid = context.auth.uid;
  const pinCode = String(data.pinCode || '').trim().toUpperCase();

  const db = admin.firestore();
  const snap = await db.collection('logRooms').where('pinCode', '==', pinCode).limit(1).get();
  if (snap.empty) {
    throw new functions.https.HttpsError('not-found', 'Mã PIN phòng không tồn tại.');
  }

  const roomDoc = snap.docs[0];
  const room = roomDoc.data();

  if ((room.members || []).includes(uid)) {
    return { room: { id: roomDoc.id, ...room } };
  }
  if ((room.members || []).length >= (room.maxMembers || 12)) {
    throw new functions.https.HttpsError('resource-exhausted', 'Phòng đã đạt giới hạn 12 thành viên.');
  }

  const userDoc = await db.collection('users').doc(uid).get();
  const userProfile = userDoc.data();

  await roomDoc.ref.update({
    members: admin.firestore.FieldValue.arrayUnion(uid),
    [`memberDetails.${uid}`]: {
      name: userProfile?.displayName || 'Thành viên',
      avatar: userProfile?.avatarUrl || '😎'
    }
  });

  const updated = await roomDoc.ref.get();
  return { room: { id: updated.id, ...updated.data() } };
});
