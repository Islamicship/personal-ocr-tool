// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDceJOCGr2Yy9wxZoMknsvLqngIvMAphKE",
  authDomain: "personal-all-tool-s.firebaseapp.com",
  projectId: "personal-all-tool-s",
  storageBucket: "personal-all-tool-s.appspot.com",
  messagingSenderId: "649061375402",
  appId: "1:649061375402:web:00d15d42f68ea5d98bdfd3",
  measurementId: "G-LGM1M06FD8"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const googleSignInBtn = document.getElementById('googleSignInBtn');
const loginError = document.getElementById('loginError');
const passwordToggle = document.getElementById('passwordToggle');
const signInBtn = document.getElementById('signInBtn');

const eyeIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const eyeOffIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
passwordToggle.innerHTML = eyeIcon;

// Redirect user if already logged in
auth.onAuthStateChanged(user => {
    if (user) window.location.href = 'index.html';
});

// Show/Hide Password Toggle
passwordToggle.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    passwordToggle.innerHTML = isPassword ? eyeOffIcon : eyeIcon;
});

// Email/Password Login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    setLoading(true);
    loginError.classList.add('hidden');
    const email = emailInput.value;
    const password = passwordInput.value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => { window.location.href = 'index.html'; })
        .catch((error) => {
            loginError.textContent = getFriendlyErrorMessage(error.code);
            loginError.classList.remove('hidden');
            setLoading(false);
        });
});

// Google Sign-In
googleSignInBtn.addEventListener('click', () => {
    setLoading(true); // Optional: show loading on Google button as well
    auth.signInWithPopup(googleProvider)
        .then(() => { window.location.href = 'index.html'; })
        .catch((error) => {
            loginError.textContent = getFriendlyErrorMessage(error.code);
            loginError.classList.remove('hidden');
            setLoading(false);
        });
});

function setLoading(isLoading) {
    signInBtn.disabled = isLoading;
    googleSignInBtn.disabled = isLoading;
    signInBtn.querySelector('.btn-text').classList.toggle('hidden', isLoading);
    signInBtn.querySelector('.spinner').classList.toggle('hidden', !isLoading);
}

function getFriendlyErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found': return 'No account found with this email.';
        case 'auth/wrong-password': return 'Incorrect password. Please try again.';
        case 'auth/invalid-email': return 'Please enter a valid email address.';
        case 'auth/popup-closed-by-user': return 'Sign-in window closed. Please try again.';
        default: return 'An unknown error occurred. Please try again.';
    }
}