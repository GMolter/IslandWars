import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  onValue,
  runTransaction,
  set
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js";

// --------- Firebase Init ---------
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
const db   = getDatabase(app);

// --------- UI Refs ---------
const welcomeEl        = document.getElementById("welcome");
const userIconEl       = document.getElementById("user-icon");
const dropdownEl       = document.getElementById("user-dropdown");
const displayNameInput = document.getElementById("display-name-input");
const saveNameBtn      = document.getElementById("save-display-name");
const signoutBtn       = document.getElementById("signout-dropdown");

const woodCount        = document.getElementById("wood-count");
const stoneCount       = document.getElementById("stone-count");
const fishCount        = document.getElementById("fish-count");
const buyHarvestBtn    = document.getElementById("buy-harvester");

// --------- Auth & Presence ---------
onAuthStateChanged(auth, user => {
  if (!user) {
    location.assign("/IslandWars/");
    return;
  }
  // greeting + icon initial
  const name = user.displayName || user.email.split("@")[0];
  welcomeEl.textContent = `Hello, ${name}`;
  userIconEl.textContent  = name.charAt(0).toUpperCase();
  displayNameInput.value = user.displayName || "";

  trackPresence(user.uid);
  subscribeToResources(user.uid);
});

// presence
function trackPresence(uid) {
  const presRef = ref(db, `presence/${uid}`);
  set(presRef, { online: true, lastSeen: Date.now() });
  window.addEventListener("beforeunload", () => {
    set(presRef, { online: false, lastSeen: Date.now() });
  });
}

// --------- Resource Subscription ---------
function subscribeToResources(uid) {
  const resRef = ref(db, `users/${uid}/resources`);
  onValue(resRef, snap => {
    const data = snap.val() || { wood:0, stone:0, fish:0 };
    woodCount.textContent  = data.wood;
    stoneCount.textContent = data.stone;
    fishCount.textContent  = data.fish;
  });
}

// --------- Buy Harvester ---------
buyHarvestBtn.addEventListener("click", () => {
  const cost   = 50;
  const resRef = ref(db, `users/${auth.currentUser.uid}/resources`);
  runTransaction(resRef, curr => {
    if (!curr) curr = { wood:0, stone:0, fish:0, harvesters:0 };
    if (curr.wood >= cost) {
      curr.wood -= cost;
      curr.harvesters = (curr.harvesters||0) + 1;
    } else {
      alert("Not enough wood!");
    }
    return curr;
  });
});

// --------- User Menu Toggle ---------
userIconEl.addEventListener("click", () => {
  dropdownEl.classList.toggle("hidden");
});

// --------- Save Display Name ---------
saveNameBtn.addEventListener("click", () => {
  const newName = displayNameInput.value.trim();
  if (!newName) return alert("Name can’t be empty.");
  updateProfile(auth.currentUser, { displayName: newName })
    .then(() => {
      welcomeEl.textContent = `Hello, ${newName}`;
      userIconEl.textContent = newName.charAt(0).toUpperCase();
      dropdownEl.classList.add("hidden");
    })
    .catch(err => alert(err.message));
});

// --------- Sign Out ---------
signoutBtn.addEventListener("click", () => {
  signOut(auth);
});
