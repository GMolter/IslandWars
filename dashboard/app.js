// initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  set,
  runTransaction
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBnDbEG_YROqReWVPW8aF85cKBcT2XTPGU",
  authDomain: "islandwarsrtdb.firebaseapp.com",
  projectId: "islandwarsrtdb",
  storageBucket: "islandwarsrtdb.firebasestorage.app",
  messagingSenderId: "968101646794",
  appId: "1:968101646794:web:c4e4d79856676cefaa3f33"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// UI refs
const welcomeEl   = document.getElementById('welcome');
const logoutBtn   = document.getElementById('logout');
const woodCount   = document.getElementById('wood-count');
const stoneCount  = document.getElementById('stone-count');
const fishCount   = document.getElementById('fish-count');
const buyHarvest  = document.getElementById('buy-harvester');

// auth guard & presence
onAuthStateChanged(auth, user => {
  if (!user) {
    location.assign('/IslandWars/'); // back to login
    return;
  }
  welcomeEl.textContent = `Hello, ${user.displayName || user.email}`;
  trackPresence(user.uid);
  subscribeToResources(user.uid);
});

// sign out
logoutBtn.addEventListener('click', () => {
  signOut(auth);
});

// presence tracking
function trackPresence(uid) {
  const presRef = ref(db, `presence/${uid}`);
  set(presRef, { online: true, lastSeen: Date.now() });
  window.addEventListener('beforeunload', () => {
    set(presRef, { online: false, lastSeen: Date.now() });
  });
}

// subscribe to your resource counts
function subscribeToResources(uid) {
  const resRef = ref(db, `users/${uid}/resources`);
  onValue(resRef, snap => {
    const data = snap.val() || { wood:0, stone:0, fish:0 };
    woodCount.textContent  = data.wood;
    stoneCount.textContent = data.stone;
    fishCount.textContent  = data.fish;
  });
}

// buy a harvester: costs 50 wood, +1 wood/minute
buyHarvest.addEventListener('click', () => {
  const cost = 50;
  const resRef = ref(db, `users/${auth.currentUser.uid}/resources`);
  runTransaction(resRef, curr => {
    if (!curr) curr = { wood:0, stone:0, fish:0, harvesters:0 };
    if (curr.wood >= cost) {
      curr.wood -= cost;
      curr.harvesters = (curr.harvesters||0) + 1;
    } else {
      alert('Not enough wood!');
    }
    return curr;
  });
});
