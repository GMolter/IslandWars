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
initializeApp(firebaseConfig);

const auth = getAuth();
const db   = getDatabase();

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
const harvesterCountEl = document.getElementById("harvester-count");
const woodRateEl       = document.getElementById("wood-rate");

const buyHarvestBtn    = document.getElementById("buy-harvester");
const gatherWoodBtn    = document.getElementById("gather-wood");
const amountBtns       = document.querySelectorAll(".amount-btn");
const priceEl          = document.getElementById("harvester-price");
const shopSection      = document.getElementById("shop-section");

let purchaseAmount = 1;
let localRes = { wood:0, stone:0, fish:0, harvesters:0 };

// --------- Cost Logic (75% increase per buy) ---------
function getNextHarvesterCost(n) {
  // n = number of harvesters already owned
  return Math.floor(75 * Math.pow(1.75, n));
}
function sumNextCosts(start, count) {
  let sum = 0;
  for (let i = 0; i < count; i++) {
    sum += getNextHarvesterCost(start + i);
  }
  return sum;
}

// --------- UI Update Functions ---------
function updateAmountUI() {
  amountBtns.forEach(btn => {
    btn.classList.toggle(
      "active",
      parseInt(btn.dataset.amount, 10) === purchaseAmount
    );
  });
}
function updatePriceUI() {
  const owned = localRes.harvesters;
  const maxBuy = Math.min(purchaseAmount, 10 - owned);
  const cost   = sumNextCosts(owned, maxBuy);
  priceEl.textContent = `Cost: ${cost}`;
  priceEl.classList.toggle("green", cost <= localRes.wood && maxBuy>0);
  priceEl.classList.toggle("red",   !(cost <= localRes.wood && maxBuy>0));
}
function refreshUI() {
  harvesterCountEl.textContent = localRes.harvesters;
  woodRateEl.textContent       = localRes.harvesters; // +1 wood/sec per harvester

  if (localRes.harvesters >= 10) {
    shopSection.style.display = "none";
  } else {
    shopSection.style.display = "block";
    updateAmountUI();
    updatePriceUI();
  }
}

// --------- Auth & Presence ---------
onAuthStateChanged(auth, user => {
  if (!user) {
    location.assign("/IslandWars/");
    return;
  }
  // Greeting & avatar
  const name = user.displayName || user.email.split("@")[0];
  welcomeEl.textContent = `Hello, ${name}`;
  userIconEl.textContent = name.charAt(0).toUpperCase();
  displayNameInput.value = user.displayName || "";

  // Presence tracking
  const presRef = ref(db, `presence/${user.uid}`);
  set(presRef, { online:true, lastSeen:Date.now() });
  window.addEventListener("beforeunload", () => {
    set(presRef, { online:false, lastSeen:Date.now() });
  });

  // Subscribe to resources
  const resRef = ref(db, `users/${user.uid}/resources`);
  onValue(resRef, snap => {
    const d = snap.val() || {};
    localRes = {
      wood: d.wood || 0,
      stone: d.stone || 0,
      fish: d.fish || 0,
      harvesters: d.harvesters || 0
    };
    woodCount.textContent   = localRes.wood;
    stoneCount.textContent  = localRes.stone;
    fishCount.textContent   = localRes.fish;
    refreshUI();
  });

  // Auto-harvest every second
  setInterval(() => {
    const n = localRes.harvesters;
    if (n > 0) {
      const r = ref(db, `users/${auth.currentUser.uid}/resources`);
      runTransaction(r, curr => {
        curr = curr || { wood:0, stone:0, fish:0, harvesters:0 };
        curr.wood = (curr.wood || 0) + n;
        return curr;
      });
    }
  }, 1000);
});

// --------- Event Listeners ---------
// Quantity toggles
amountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    purchaseAmount = parseInt(btn.dataset.amount, 10);
    updateAmountUI();
    updatePriceUI();
  });
});

// Manual gather
gatherWoodBtn.addEventListener("click", () => {
  const r = ref(db, `users/${auth.currentUser.uid}/resources`);
  runTransaction(r, curr => {
    curr = curr || { wood:0, stone:0, fish:0, harvesters:0 };
    curr.wood = (curr.wood || 0) + 1;
    return curr;
  });
});

// Buy harvesters
buyHarvestBtn.addEventListener("click", () => {
  const owned = localRes.harvesters;
  const maxBuy = Math.min(purchaseAmount, 10 - owned);
  if (maxBuy <= 0) {
    return alert("You’ve reached the max of 10 harvesters");
  }
  const cost = sumNextCosts(owned, maxBuy);
  if (localRes.wood < cost) {
    return alert("Not enough wood");
  }
  const r = ref(db, `users/${auth.currentUser.uid}/resources`);
  runTransaction(r, curr => {
    curr = curr || { wood:0, stone:0, fish:0, harvesters:0 };
    curr.wood -= cost;
    curr.harvesters = (curr.harvesters || 0) + maxBuy;
    return curr;
  });
});

// User menu toggle / save name / sign out
userIconEl.addEventListener("click", () =>
  dropdownEl.classList.toggle("hidden")
);
saveNameBtn.addEventListener("click", () => {
  const nn = displayNameInput.value.trim();
  if (!nn) return alert("Name can’t be empty");
  updateProfile(auth.currentUser, { displayName: nn })
    .then(() => {
      welcomeEl.textContent = `Hello, ${nn}`;
      userIconEl.textContent = nn.charAt(0).toUpperCase();
      dropdownEl.classList.add("hidden");
    })
    .catch(e => alert(e.message));
});
signoutBtn.addEventListener("click", () => signOut(auth));
