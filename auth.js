import { initializeApp } from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-auth.js";

// your config
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
const googleProvider = new GoogleAuthProvider();

// tabs
const tabLogin  = document.getElementById('tab-login');
const tabSignup = document.getElementById('tab-signup');
const formLogin  = document.getElementById('login-form');
const formSignup = document.getElementById('signup-form');

tabLogin.addEventListener('click', () => {
  tabLogin.classList.add('active');
  tabSignup.classList.remove('active');
  formLogin.classList.remove('hidden');
  formSignup.classList.add('hidden');
});
tabSignup.addEventListener('click', () => {
  tabSignup.classList.add('active');
  tabLogin.classList.remove('active');
  formSignup.classList.remove('hidden');
  formLogin.classList.add('hidden');
});

// login
formLogin.addEventListener('submit', e => {
  e.preventDefault();
  const email = e.target['login-email'].value;
  const pw    = e.target['login-password'].value;
  signInWithEmailAndPassword(auth, email, pw)
    .then(() => location.assign('dashboard/'))
    .catch(err => alert(err.message));
});

// google
document.getElementById('google-signin').addEventListener('click', () => {
  signInWithPopup(auth, googleProvider)
    .then(() => location.assign('dashboard/'))
    .catch(err => alert(err.message));
});

// signup
formSignup.addEventListener('submit', e => {
  e.preventDefault();
  const email = e.target['signup-email'].value;
  const pw    = e.target['signup-password'].value;
  const cpw   = e.target['signup-confirm'].value;
  if (pw !== cpw) return alert("Passwords don't match");
  createUserWithEmailAndPassword(auth, email, pw)
    .then(() => location.assign('dashboard/'))
    .catch(err => alert(err.message));
});
