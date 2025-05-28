// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBnDbEG_YROqReWVPW8aF85cKBcT2XTPGU",
  authDomain: "islandwarsrtdb.firebaseapp.com",
  projectId: "islandwarsrtdb",
  storageBucket: "islandwarsrtdb.firebasestorage.app",
  messagingSenderId: "968101646794",
  appId: "1:968101646794:web:c4e4d79856676cefaa3f33"
};

// init
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// FirebaseUI setup
const ui = new firebaseui.auth.AuthUI(auth);
const uiConfig = {
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => {
      // go to the lowercase dashboard folder
      window.location.assign('dashboard/');
      return false;
    }
  }
};

// start
ui.start('#firebaseui-auth-container', uiConfig);
