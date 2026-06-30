import { auth, db } from './firebase-config.js';
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { doc, setDoc, collection, addDoc, getDocs, query, where, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

let lastPinSentTime = 0;

// Hide page loader once the window is fully loaded
window.addEventListener('load', () => {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loader.classList.add('loader-hidden');
    }
});

const registerForm = document.getElementById('registerForm');
const togglePassword = document.querySelector('.password-toggle');
const passwordInput = document.querySelector('#regPassword');

togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    document.getElementById('toggleIcon').classList.toggle('fa-eye');
    document.getElementById('toggleIcon').classList.toggle('fa-eye-slash');
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Disable button immediately and change text
    const submitBtn = registerForm.querySelector('.btn-register');
    submitBtn.disabled = true;
    submitBtn.innerText = "Signing up...";

    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const fullName = document.getElementById('fullName').value;

        try {
        // 1. Create the Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2 & 3. SECURELY INITIALIZE PROFILE VIA CLOUD FUNCTION
        // Moving Logic 1 "Brain" to the server to prevent hacking
        const { getFunctions, httpsCallable } = await import("https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js");
        const functions = getFunctions();
        const initProfile = httpsCallable(functions, 'initializeStudentProfile');
        
        // This function sets up user documentation and automatically fires verification mail cleanly from the backend
        await initProfile({
            fullName: fullName,
            email: email,
            uid: user.uid
        });

        // 5. SHOW THE MODAL
        lastPinSentTime = Date.now();
        document.getElementById('pinModal').style.display = 'flex';

        // 6. Reset button for success path (so it doesn't stay stuck on "Signing up")
        submitBtn.disabled = false;
        submitBtn.innerText = "Sign Up";

        // 7. STORE DATA FOR THE VERIFY BUTTON
        window.pendingUser = {
            uid: user.uid
        };

    } catch (error) {

        // 1. Re-enable button so user can fix details and try again
        const submitBtn = registerForm.querySelector('.btn-register');
        submitBtn.disabled = false;
        submitBtn.innerText = "Sign Up";

        console.error("Atlas Registration Error:", error);
        if (error.code === 'auth/email-already-in-use') {
            try {
                const { getFunctions, httpsCallable } = await import("https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js");
                const functions = getFunctions();
                const checkDuplicate = httpsCallable(functions, 'checkDuplicateStudent');
                
                const dupResult = await checkDuplicate({ email: email });

                if (dupResult.data.exists) {
                    if (dupResult.data.isVerified === false) {
                        alert("Account exists but is not verified. Redirecting to Login to complete verification.");
                    } else {
                        alert("Account already in use and verified. Please use the Login page.");
                    }
                    window.location.href = "login.html";
                    return;
                }
            } catch (dupError) {
                console.error("Duplicate Check Function Error:", dupError);
            }
            alert("This email is already in use. Please use a different email.");
            return;
        }
        alert("Registration Error: " + error.message);
    } 
});

// VERIFICATION BUTTON LOGIC
document.getElementById('verifyPinBtn').addEventListener('click', async () => {
    const enteredPin = document.getElementById('inputPin').value;
    
    if (!window.pendingUser) {
        alert("Session expired. Please refresh and try again.");
        return;
    }

        const { uid } = window.pendingUser;
    
    try {
        const { getFunctions, httpsCallable } = await import("https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js");
        const functions = getFunctions();
        const verifyPinFunc = httpsCallable(functions, 'verifyStudentPin');

        const result = await verifyPinFunc({ uid, enteredPin });

        if (result.data.success) {
            alert("Email Verified Successfully!");
            window.location.href = "login.html";
        } else {
            alert(result.data.message); // Shows "Incorrect PIN"
        }
    } catch (error) {
        console.error("Verification Error:", error);
        alert("Error updating verification: " + error.message);
    }
});

document.getElementById('resendPinBtn').addEventListener('click', async () => {
    if (!window.pendingUser) return;

    const { uid } = window.pendingUser;
    
    try {
        const { getFunctions, httpsCallable } = await import("https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js");
        const functions = getFunctions();
        const resendPinFunc = httpsCallable(functions, 'resendStudentPin');

        const result = await resendPinFunc({ uid });

        if (result.data.success) {
            // The mail is safely and completely sent on the backend server now
            alert("A new PIN has been sent to your email.");
        } else {
            alert(result.data.message); // This will show the cooldown error from the server
        }
    } catch (error) {
        console.error("Resend Error:", error);
        alert("Error resending PIN: " + error.message);
    }
});

