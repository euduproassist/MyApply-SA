import { auth, db } from './firebase-config.js'; // FIXED: Added db import
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { doc, getDoc, updateDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js"; // FIXED: Added direct imports
import { getFunctions, httpsCallable } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js"; 

const functions = getFunctions();
let lastPinSentTime = 0;

// Hide page loader once the window is fully loaded
window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.classList.add('loader-hidden');
    }
});

const loginForm = document.getElementById('loginForm');
const togglePassword = document.querySelector('.password-toggle');
const passwordInput = document.querySelector('#password');

// Toggle Password Visibility
togglePassword.addEventListener('click', function () {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    const icon = this.querySelector('#toggleIcon');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

// Handle Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable button immediately
    const submitBtn = loginForm.querySelector('.btn-login');
    submitBtn.disabled = true;
    submitBtn.innerText = "Logging in...";
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Call the secure Cloud Function for security checks
        const { data: loginCheck } = await httpsCallable(functions, 'processLoginSecurity')({ uid: user.uid });

        if (loginCheck.status === "NO_ACCOUNT") {
            alert("No account found in database. Redirecting to Register.");
            await signOut(auth);
            window.location.href = "register.html";
            return;
        }

                if (loginCheck.status === "VERIFY") {
            // Secret data extraction completely dropped to hide verification mechanics from browser tools
            window.pendingUser = { uid: user.uid, email: email };
            lastPinSentTime = Date.now();
            submitBtn.disabled = false;
            submitBtn.innerText = "Log In";
            
            document.getElementById('pinModal').style.display = 'flex';
            return;
        }
       
        alert("Login Successful!");
        window.location.href = "applicant.html"; 

        } catch (error) {

        const submitBtn = loginForm.querySelector('.btn-login');
        submitBtn.disabled = false;
        submitBtn.innerText = "Log In";
        
        if (error.code === 'auth/user-not-found') {
            alert("No user found. Redirecting to Register.");
            window.location.href = "register.html";
        } else {
            alert("Error: " + error.message);
        }
    }
});

// Forgot Password
document.getElementById('forgotPass').addEventListener('click', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value || prompt("Please enter your email address:");
    
    if (email) {
        sendPasswordResetEmail(auth, email)
            .then(() => alert("Password reset link sent to: " + email))
            .catch((error) => alert("Error: " + error.message));
    }
});

document.getElementById('verifyPinBtn').addEventListener('click', async () => {
    const enteredPin = document.getElementById('inputPin').value;
    
    // Disable button to prevent multiple clicks
    const verifyBtn = document.getElementById('verifyPinBtn');
    verifyBtn.disabled = true;

    try {
        // Call the secure Cloud Function to verify
        const { data: result } = await httpsCallable(functions, 'verifyLoginPin')({
            uid: window.pendingUser.uid,
            enteredPin: enteredPin
        });

        if (result.success) {
            alert("Verification Successful!");
            window.location.href = "applicant.html"; 
        } else {
            alert(result.message); // Shows "Incorrect PIN" from server
            verifyBtn.disabled = false;
        }
    } catch (error) {
        // Error shown in console and alert as requested
        console.error("Atlas PIN Error:", error);
        alert("Error: " + error.message);
        verifyBtn.disabled = false;
    }
});

document.getElementById('resendPinBtn').addEventListener('click', async () => {
    if (!window.pendingUser) return;

        try {
        const { uid } = window.pendingUser;
        
        // Call the secure Cloud Function to handle generation and cooldown check
        const { data: result } = await httpsCallable(functions, 'resendLoginPin')({ uid: uid });

        if (!result.success && result.status === "COOLDOWN") {
            alert(`Please wait ${result.secondsLeft} seconds before requesting a new PIN.`);
            return;
        }

        alert("A new PIN has been sent to your email.");

    } catch (error) {

        console.error("Atlas Resend PIN Error:", error);
        alert("Error: " + error.message);
    }
});


