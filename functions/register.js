const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// ============================================================
// ROLE: Student
// FILE: Register.js
// PURPOSE: Handles secure student profile initialization.
// Generates the 6-digit PIN on the server, creates the 
// user document with a locked "student" role, and triggers the verification email.
// ============================================================
exports.initializeStudentProfile = onCall({ maxInstances: 10 }, async (request) => {
    // Error handling for unauthenticated calls
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    }

    const { fullName, email, uid } = request.data;

    try {
        // Generate the PIN securely on the server
        const verificationPin = Math.floor(100000 + Math.random() * 900000).toString();

        // Create the user document in Firestore using Admin SDK
        await admin.firestore().collection("users").doc(uid).set({
            fullName: fullName,
            email: email,
            role: "student",
            createdAt: new Date(), // Using new Date() as requested
            verificationPin: verificationPin,
            isVerified: false,
            lastVerifiedAt: null,
            lastPinSentAt: new Date() // Syncs the initial creation timestamp with your resend cooldown check
        });

        // Natively handle the secure email generation on the server to prevent browser manipulation
        await admin.firestore().collection("mail").add({
            to: email,
            from: "Atlas Admissions <eduproassist44@gmail.com>",
            message: {
                subject: "Verify Your Account - Student Application Portal",
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; padding: 20px; border-top: 5px solid #4a90e2;">
                        <div style="text-align: center; color: #4a90e2; margin-bottom: 25px;">
                            <i class="fas fa-graduation-cap" style="font-size: 40px;"></i>
                            <h2 style="margin-top: 10px; color: #333;">Welcome to the Portal</h2>
                        </div>
                        <p style="color: #333;">Hi <strong>${fullName}</strong>,</p>
                        <p style="color: #555; line-height: 1.6;">Thank you for registering. Use the 6-digit code below to verify your email address:</p>
                        <div style="text-align: center; margin: 35px 0;">
                            <h1 style="font-size: 48px; letter-spacing: 10px; color: #4a90e2; background: #f4f7f9; padding: 20px; border-radius: 8px; display: inline-block;">${verificationPin}</h1>
                        </div>
                        <p style="font-size: 0.85rem; color: #888; text-align: center;">Enter this code in the registration window to complete your setup.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
                        <p style="color: #555;">Regards,<br><strong style="color: #333;">Atlas Admissions Team</strong></p>
                    </div>`
            }
        });

        // Hide raw pin delivery to browser to eliminate client inspection vulnerabilities
        return { success: true };
    } catch (error) {
        console.error("Cloud Function Error:", error);
        throw new HttpsError('internal', error.message);
    }
});

// ============================================================
// ROLE: Student
// FILE: Register.js (Verification Section)
// PURPOSE: Securely validates the PIN entered by the student.
// If correct, it updates the database to 'isVerified: true'.
// ============================================================
exports.verifyStudentPin = onCall({ maxInstances: 10 }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, enteredPin } = request.data;

    try {
        const userDoc = await admin.firestore().collection("users").doc(uid).get();
        
        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'Student profile not found.');
        }

        const userData = userDoc.data();

        // Secure server-side comparison
        if (userData.verificationPin === enteredPin) {
            await admin.firestore().collection("users").doc(uid).update({
                isVerified: true,
                lastVerifiedAt: new Date()
            });
            return { success: true, message: "Verification successful!" };
        } else {
            return { success: false, message: "Incorrect PIN. Please try again." };
        }
    } catch (error) {
        console.error("Verification Error:", error);
        throw new HttpsError('internal', error.message);
    }
});

// ============================================================
// ROLE: Student
// FILE: Register.js (Resend PIN Section)
// PURPOSE: Securely regenerates a new PIN, transmits email message, 
// and enforces a 30-second server cooldown.
// ============================================================
exports.resendStudentPin = onCall({ maxInstances: 10 }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid } = request.data;

    try {
        const userRef = admin.firestore().collection("users").doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'Student profile not found.');
        }

        const userData = userDoc.data();
        const now = Date.now();
        const lastSent = userData.lastPinSentAt ? userData.lastPinSentAt.toDate().getTime() : 0;
        const cooldown = 30000; // 30 seconds

        if (now - lastSent < cooldown) {
            const secondsLeft = Math.ceil((cooldown - (now - lastSent)) / 1000);
            return { success: false, message: `Please wait ${secondsLeft} seconds.`, cooldownActive: true };
        }

        const newPin = Math.floor(100000 + Math.random() * 900000).toString();

        await userRef.update({
            verificationPin: newPin,
            lastPinSentAt: new Date() // Keeping track of resend time on server
        });

        // Natively handle the resend email generation on the server using your specific data mapping
        await admin.firestore().collection("mail").add({
            to: userData.email, // Securely matches the email linked directly to the database profile
            from: "Atlas Admissions <eduproassist44@gmail.com>",
            message: {
                subject: "New Verification Code",
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; padding: 20px; border-top: 5px solid #4a90e2;">
                        <div style="text-align: center; color: #4a90e2; margin-bottom: 25px;">
                            <i class="fas fa-graduation-cap" style="font-size: 40px;"></i>
                            <h2 style="margin-top: 10px; color: #333;">New Verification Code</h2>
                        </div>
                        <p style="color: #333;">Hello,</p>
                        <p style="color: #555; line-height: 1.6;">You requested a new PIN to verify your account. Please use the code below:</p>
                        <div style="text-align: center; margin: 35px 0;">
                            <h1 style="font-size: 48px; letter-spacing: 10px; color: #4a90e2; background: #f4f7f9; padding: 20px; border-radius: 8px; display: inline-block;">${newPin}</h1>
                        </div>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
                        <p style="color: #555;">Regards,<br><strong style="color: #333;">Atlas Admissions Team</strong></p>
                    </div>`
            }
        });

        // Hide raw pin delivery from browser client
        return { success: true };
    } catch (error) {
        throw new HttpsError('internal', error.message);
    }
});

// ============================================================
// ROLE: Student
// FILE: Register.js (Duplicate Check Section)
// PURPOSE: Checks if an email is already registered and if the 
// account is verified before allowing or blocking registration.
// ============================================================
exports.checkDuplicateStudent = onCall({ maxInstances: 10 }, async (request) => {
    const { email } = request.data;

    try {
        const userQuery = await admin.firestore().collection("users")
            .where("email", "==", email)
            .limit(1)
            .get();

        if (userQuery.empty) {
            return { exists: false };
        }

        const userData = userQuery.docs[0].data();
        return { 
            exists: true, 
            isVerified: userData.isVerified || false 
        };
    } catch (error) {
        console.error("Duplicate Check Error:", error);
        throw new HttpsError('internal', error.message);
    }
});
