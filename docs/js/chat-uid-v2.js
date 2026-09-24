/* CAHAYA APP — UID-authorized chat client.
 * Room membership is created by trusted Cloud Functions; the browser may only
 * read/write rooms admitted by RTDB Rules. No username/localStorage authority. */
(function (global) {
  "use strict";

  const REGION = "us-central1";
  const ROOT = "cahaya_chat_v2";

  function requireFirebase() {
    if (!global.firebase?.auth || !global.firebase?.database || !global.firebase?.functions) {
      throw new Error("SECURE_CHAT_FIREBASE_SDK_REQUIRED");
    }
  }

  async function authUser() {
    requireFirebase();
    if (global.firebase.auth().currentUser) return global.firebase.auth().currentUser;
    return new Promise((resolve, reject) => {
      let timer;
      const stop = global.firebase.auth().onAuthStateChanged(user => {
        clearTimeout(timer); stop();
        user ? resolve(user) : reject(new Error("SECURE_CHAT_AUTH_REQUIRED"));
      }, reject);
      timer = setTimeout(() => { stop(); reject(new Error("SECURE_CHAT_AUTH_TIMEOUT")); }, 8000);
    });
  }

  function callable(name) {
    requireFirebase();
    return global.firebase.app().functions(REGION).httpsCallable(name);
  }

  async function listContacts() {
    await authUser();
    const result = await callable("listSecureChatContacts")({});
    return Array.isArray(result.data?.contacts) ? result.data.contacts : [];
  }

  async function openRoom(counterpartUid, studentKey) {
    await authUser();
    const result = await callable("openSecureChatRoom")({counterpartUid, studentKey});
    if (!result.data?.roomId) throw new Error("SECURE_CHAT_ROOM_NOT_READY");
    return result.data;
  }

  async function verifyRoom(roomId) {
    const user = await authUser();
    const snapshot = await global.firebase.database().ref(`${ROOT}/rooms/${roomId}`).once("value");
    const room = snapshot.val();
    if (!room?.members?.[user.uid]?.active) throw new Error("SECURE_CHAT_ROOM_DENIED");
    return room;
  }

  async function send(roomId, text, senderDisplay) {
    const user = await authUser();
    const value = String(text || "").trim();
    if (!value || value.length > 4000) throw new Error("SECURE_CHAT_INVALID_MESSAGE");
    const room = await verifyRoom(roomId);
    const ref = global.firebase.database().ref(`${ROOT}/rooms/${roomId}/messages`).push();
    await ref.set({
      text:value,
      senderUid:user.uid,
      senderDisplay:String(room.members?.[user.uid]?.label || senderDisplay || user.displayName || user.email || "Pengguna CAHAYA").trim(),
      createdAt:global.firebase.database.ServerValue.TIMESTAMP
    });
    return ref.key;
  }

  async function markRead(roomId, timestamp = Date.now()) {
    const user = await authUser();
    await verifyRoom(roomId);
    const lastReadAt = Number(timestamp) || Date.now();
    const updates = {};
    updates[`${ROOT}/rooms/${roomId}/receipts/${user.uid}`] = {lastReadAt};
    updates[`${ROOT}/user_rooms/${user.uid}/${roomId}/lastReadAt`] = lastReadAt;
    return global.firebase.database().ref().update(updates);
  }

  async function listenUserRooms(onValue, onError) {
    const user = await authUser();
    const query = global.firebase.database().ref(`${ROOT}/user_rooms/${user.uid}`).orderByChild("updatedAt");
    const callback = snapshot => onValue(snapshot.val() || {}, user);
    query.on("value", callback, onError);
    return () => query.off("value", callback);
  }

  async function listenMessages(roomId, onValue, onError, limit = 50) {
    await verifyRoom(roomId);
    const query = global.firebase.database().ref(`${ROOT}/rooms/${roomId}/messages`).limitToLast(limit);
    const callback = snapshot => onValue(snapshot.val() || {});
    query.on("value", callback, onError);
    return () => query.off("value", callback);
  }

  global.CahayaSecureChat = Object.freeze({
    root:ROOT,
    authUser,
    listContacts,
    openRoom,
    verifyRoom,
    send,
    markRead,
    listenUserRooms,
    listenMessages
  });
})(window);
