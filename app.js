
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBj17PxCRuOKRJdWD2Hj1ybIWy30DjVAL0",
  authDomain: "vynix-363fb.firebaseapp.com",
  projectId: "vynix-363fb",
  storageBucket: "vynix-363fb.firebasestorage.app",
  messagingSenderId: "571189480939",
  appId: "1:571189480939:web:ead9ab46bb628a6baa5dae",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

export const LEADER_ACCESS_CODE = "VYNIX-CORE-2026";

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signUpWithEmail(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

export async function ensureAnonymousSignIn() {
  if (auth.currentUser) return auth.currentUser;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

export function signOutUser() {
  return signOut(auth);
}

export function authErrorMessage(err) {
  const code = err && err.code ? err.code : "";
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-not-found": "No account matches that email.",
    "auth/wrong-password": "Wrong password — try again.",
    "auth/invalid-credential": "Email or password is incorrect.",
    "auth/email-already-in-use": "An account already exists for that email — sign in instead.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/popup-closed-by-user": "Google sign-in was closed before finishing.",
    "auth/network-request-failed": "Network error — check your connection and try again.",
  };
  return map[code] || (err && err.message) || "Something went wrong. Please try again.";
}

const REQUESTS_COLLECTION = "teamRequests";

export async function submitJoinRequest(user, data) {
  return addDoc(collection(db, REQUESTS_COLLECTION), {
    uid: user.uid,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    experience: data.experience,
    skills: data.skills,
    message: data.message,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function listenMyRequests(uid, callback, onError) {
  const q = query(
    collection(db, REQUESTS_COLLECTION),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    callback(items);
  }, (err) => {
    console.error("listenMyRequests failed:", err);
    if (onError) onError(err);
  });
}

export function listenAllRequests(callback, onError) {
  const q = query(collection(db, REQUESTS_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    callback(items);
  }, onError);
}

export function updateRequestStatus(requestId, status) {
  return updateDoc(doc(db, REQUESTS_COLLECTION, requestId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export const LEADER_EMAILS = [
  "leomh312@gmail.com",
];

export function isLeaderEmail(email) {
  if (!email) return false;
  return LEADER_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}

const INQUIRIES_COLLECTION = "clientInquiries";

export async function submitClientInquiry(data) {
  return addDoc(collection(db, INQUIRIES_COLLECTION), {
    name: data.name,
    email: data.email,
    business: data.business,
    projectType: data.projectType,
    budget: data.budget,
    timeline: data.timeline,
    message: data.message,
    status: "new",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export function listenAllInquiries(callback, onError) {
  const q = query(collection(db, INQUIRIES_COLLECTION), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    callback(items);
  }, onError);
}

export function updateInquiryStatus(inquiryId, status) {
  return updateDoc(doc(db, INQUIRIES_COLLECTION, inquiryId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

const CONVERSATIONS_COLLECTION = "conversations";

export async function startConversation(clientUid, clientName, clientEmail, firstMessageText) {
  const convRef = await addDoc(collection(db, CONVERSATIONS_COLLECTION), {
    clientUid,
    clientName,
    clientEmail,
    participants: [clientUid],
    lastMessage: firstMessageText,
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
  await addDoc(collection(db, CONVERSATIONS_COLLECTION, convRef.id, "messages"), {
    senderId: clientUid,
    senderType: "client",
    senderLabel: clientName,
    type: "text",
    text: firstMessageText,
    imageUrl: "",
    createdAt: serverTimestamp(),
  });
  return convRef.id;
}

export function listenMessages(conversationId, callback, onError) {
  const q = query(
    collection(db, CONVERSATIONS_COLLECTION, conversationId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    callback(items);
  }, onError);
}

export async function sendMessage(conversationId, senderId, senderType, senderLabel, payload) {
  const isImage = !!payload.imageUrl;
  await addDoc(collection(db, CONVERSATIONS_COLLECTION, conversationId, "messages"), {
    senderId,
    senderType,
    senderLabel,
    type: isImage ? "image" : "text",
    text: payload.text || "",
    imageUrl: payload.imageUrl || "",
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, CONVERSATIONS_COLLECTION, conversationId), {
    lastMessage: isImage ? "📷 Image" : payload.text,
    lastMessageAt: serverTimestamp(),
  });
}

export async function uploadChatImage(conversationId, file) {
  const path = `chatImages/${conversationId}/${Date.now()}_${file.name}`;
  const fileRef = storageRef(storage, path);
  await uploadBytes(fileRef, file);
  return getDownloadURL(fileRef);
}

export function listenAllConversations(callback, onError) {
  const q = query(collection(db, CONVERSATIONS_COLLECTION), orderBy("lastMessageAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    callback(items);
  }, onError);
}
