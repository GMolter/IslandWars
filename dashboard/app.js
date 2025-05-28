import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getDatabase, ref, onValue, runTransaction, set
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js";

// Firebase init
const firebaseConfig = {
  apiKey: "AIzaSyBnDbEG_YROqReWVPW8aF85cKBcT2XTPGU",
  authDomain: "islandwarsrtdb.firebaseapp.com",
  projectId: "islandwarsrtdb",
  storageBucket: "islandwarsrtdb.firebasestorage.app",
  messagingSenderId: "968101646794",
  appId: "1:968101646794:web:c4e4d79856676cefaa3f33"
};
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getDatabase(app);

// UI refs
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

// Cost funcs
function getNextHarvesterCost(n) {
  return Math.floor(75 * Math.pow(1.2, n));
}
function sumNextCosts(start, count) {
  let sum = 0;
  for (let i = 0; i < count; i++) {
    sum += getNextHarvesterCost(start + i);
  }
  return sum;
}

// UI Refresh
function updateAmountUI() {
  amountBtns.forEach(btn => {
    btn.classList.toggle("active",
      parseInt(btn.dataset.amount,10) === purchaseAmount
    );
  });
}
function updatePriceUI() {
  const n = localRes.harvesters;
  const maxBuy = Math.min(purchaseAmount, 10 - n);
  const cost   = sumNextCosts(n, maxBuy);
  priceEl.textContent = `Cost: ${cost}`;
  priceEl.classList.toggle("green", cost <= localRes.wood && maxBuy>0);
  priceEl.classList.toggle("red", !(cost <= localRes.wood && maxBuy>0));
}
function refreshUI() {
  harvesterCountEl.textContent = localRes.harvesters;
  woodRateEl.textContent       = localRes.harvesters;

  // hide shop at max
  if (localRes.harvesters >= 10) {
    shopSection.style.display = "none";
  } else {
    shopSection.style.display = "block";
    updateAmountUI();
    updatePriceUI();
  }
}

// Auth & presence
onAuthStateChanged(auth, user => {
  if (!user) return location.assign("/IslandWars/");
  const name = user.displayName || user.email.split("@")[0];
  welcomeEl.textContent = `Hello, ${name}`;
  userIconEl.textContent = name[0].toUpperCase();
  displayNameInput.value = user.displayName || "";

  // presence
  const presRef = ref(db, `presence/${user.uid}`);
  set(presRef, { online:true, lastSeen:Date.now() });
  window.addEventListener("beforeunload", () =>
    set(presRef, { online:false, lastSeen:Date.now() })
  );

  // subscribe
  const rRef = ref(db, `users/${user.uid}/resources`);
  onValue(rRef, snap => {
    const d = snap.val() || {};
    localRes = {
      wood: d.wood||0,
      stone: d.stone||0,
      fish: d.fish||0,
      harvesters: d.harvesters||0
    };
    woodCount.textContent  = localRes.wood;
    stoneCount.textContent = localRes.stone;
    fishCount.textContent  = localRes.fish;
    refreshUI();
  });

  // auto‐harvest
  setInterval(() => {
    const n = localRes.harvesters;
    if (n > 0) {
      const r = ref(db, `users/${auth.currentUser.uid}/resources`);
      runTransaction(r, curr => {
        curr = curr || { wood:0, stone:0, fish:0, harvesters:0 };
        curr.wood = (curr.wood||0) + n;
        return curr;
      });
    }
  }, 1000);
});

// Listeners
amountBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    purchaseAmount = parseInt(btn.dataset.amount,10);
    updateAmountUI();
    updatePriceUI();
  });
});

gatherWoodBtn.addEventListener("click", ()=>{
  const r = ref(db, `users/${auth.currentUser.uid}/resources`);
  runTransaction(r, curr => {
    curr = curr || { wood:0, stone:0, fish:0, harvesters:0 };
    curr.wood = (curr.wood||0) + 1;
    return curr;
  });
});

buyHarvestBtn.addEventListener("click", ()=>{
  const n = localRes.harvesters;
  const maxBuy = Math.min(purchaseAmount, 10 - n);
  if (maxBuy <= 0) return alert("Max harvesters reached");
  const cost = sumNextCosts(n, maxBuy);
  if (localRes.wood < cost) return alert("Not enough wood");
  const r = ref(db, `users/${auth.currentUser.uid}/resources`);
  runTransaction(r, curr => {
    curr = curr || { wood:0, stone:0, fish:0, harvesters:0 };
    curr.wood -= cost;
    curr.harvesters = (curr.harvesters||0) + maxBuy;
    return curr;
  });
});

// user menu toggle / save / sign out
userIconEl.addEventListener("click", ()=> dropdownEl.classList.toggle("hidden"));
saveNameBtn.addEventListener("click", ()=>{
  const nn = displayNameInput.value.trim();
  if (!nn) return alert("Name can’t be empty");
  updateProfile(auth.currentUser, { displayName:nn })
    .then(()=>{
      welcomeEl.textContent = `Hello, ${nn}`;
      userIconEl.textContent = nn[0].toUpperCase();
      dropdownEl.classList.add("hidden");
    })
    .catch(e=>alert(e.message));
});
signoutBtn.addEventListener("click", ()=> signOut(auth));
