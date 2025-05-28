import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut, updateProfile
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";
import {
  getDatabase, ref, onValue, runTransaction, set
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-database.js";

// --- Firebase init ---
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

// --- UI refs ---
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

const buyHarvestBtn    = document.getElementById("buy-harvester");
const gatherWoodBtn    = document.getElementById("gather-wood");
const amountBtns       = document.querySelectorAll(".amount-btn");
const costDisplay      = document.getElementById("harvester-cost-display");

let purchaseAmount = 1;
let localRes = { wood:0, stone:0, fish:0, harvesters:0 };

// ----- Cost logic -----
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

// ----- UI updates -----
function updateAmountUI() {
  amountBtns.forEach(btn => {
    btn.classList.toggle("active",
      parseInt(btn.dataset.amount,10) === purchaseAmount
    );
  });
}
function updateCostDisplay() {
  const n = localRes.harvesters;
  const maxBuyable = Math.min(purchaseAmount, 10 - n);
  const cost = sumNextCosts(n, maxBuyable);
  costDisplay.textContent = `Cost: ${cost}`;
  if (cost <= localRes.wood && maxBuyable > 0) {
    costDisplay.classList.add("green");
    costDisplay.classList.remove("red");
    buyHarvestBtn.disabled = false;
  } else {
    costDisplay.classList.add("red");
    costDisplay.classList.remove("green");
    buyHarvestBtn.disabled = maxBuyable === 0;
  }
}
function refreshUI() {
  harvesterCountEl.textContent = localRes.harvesters;
  updateAmountUI();
  updateCostDisplay();
}

// ----- Auth & presence -----
onAuthStateChanged(auth, user => {
  if (!user) return location.assign("/IslandWars/");
  const name = user.displayName || user.email.split("@")[0];
  welcomeEl.textContent = `Hello, ${name}`;
  userIconEl.textContent = name.charAt(0).toUpperCase();
  displayNameInput.value = user.displayName || "";

  // presence
  const presRef = ref(db, `presence/${user.uid}`);
  set(presRef, { online:true, lastSeen:Date.now() });
  window.addEventListener("beforeunload", () =>
    set(presRef, { online:false, lastSeen:Date.now() })
  );

  // subscribe to resources
  const resRef = ref(db, `users/${user.uid}/resources`);
  onValue(resRef, snap => {
    const d = snap.val() || {};
    localRes = {
      wood: d.wood||0,
      stone: d.stone||0,
      fish: d.fish||0,
      harvesters: d.harvesters||0
    };
    woodCount.textContent   = localRes.wood;
    stoneCount.textContent  = localRes.stone;
    fishCount.textContent   = localRes.fish;
    refreshUI();
  });

  // auto-harvest every second
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

// ----- Event listeners -----
amountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    purchaseAmount = parseInt(btn.dataset.amount, 10);
    updateAmountUI();
    updateCostDisplay();
  });
});

gatherWoodBtn.addEventListener("click", () => {
  const r = ref(db, `users/${auth.currentUser.uid}/resources`);
  runTransaction(r, curr => {
    curr = curr || { wood:0, stone:0, fish:0, harvesters:0 };
    curr.wood = (curr.wood||0) + 1;
    return curr;
  });
});

buyHarvestBtn.addEventListener("click", () => {
  const n = localRes.harvesters;
  const maxBuy = Math.min(purchaseAmount, 10 - n);
  if (maxBuy <= 0) return alert("No more harvesters available");
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

// user menu
userIconEl.addEventListener("click", () =>
  dropdownEl.classList.toggle("hidden")
);
saveNameBtn.addEventListener("click", () => {
  const nn = displayNameInput.value.trim();
  if (!nn) return alert("Name can’t be empty");
  updateProfile(auth.currentUser, { displayName:nn })
    .then(()=>{
      welcomeEl.textContent = `Hello, ${nn}`;
      userIconEl.textContent = nn.charAt(0).toUpperCase();
      dropdownEl.classList.add("hidden");
    })
    .catch(e=>alert(e.message));
});
signoutBtn.addEventListener("click", ()=>signOut(auth));
