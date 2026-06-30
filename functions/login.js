const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

// ============================================================
// ROLE: Student
// FILE: Login.js (Login Security Processing Section)
// PURPOSE: Validates user existence, checks 14-day security rule, 
// updates Firestore, and builds/transmits the verification email natively.
// ============================================================
exports.processLoginSecurity = onCall({ maxInstances: 10 }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid } = request.data;

    try {
        const userRef = admin.firestore().collection("users").doc(uid);
        const userDoc = await userRef.get();

        // 1. Check if user exists in Database
        if (!userDoc.exists) {
            return { status: "NO_ACCOUNT" };
        }

        const userData = userDoc.data();
        let needsVerification = false;

        // 2. Check if never verified
        if (userData.isVerified !== true) {
            needsVerification = true;
        } else if (userData.lastVerifiedAt) {
            // 3. Check 14-day rule (14 days in milliseconds: 1209600000)
            const lastVerified = userData.lastVerifiedAt.toDate().getTime();
            const now = new Date().getTime();
            if (now - lastVerified > 1209600000) {
                needsVerification = true;
            }
        }

        if (needsVerification) {
            const newPin = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Update Firestore on the server (Rules allow this via Admin SDK)
            await userRef.update({ 
                verificationPin: newPin, 
                isVerified: false 
            });

            // Natively handle the mail generation using Admin SDK to secure the message structure
            await admin.firestore().collection("mail").add({
                to: userData.email,
                from: "Atlas Admissions <eduproassist44@gmail.com>",
                message: {
                    subject: "Security Verification - Student Portal",
                    html: `
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; padding: 20px; border-top: 5px solid #4a90e2;">
                            <div style="text-align: center; color: #4a90e2; margin-bottom: 25px;">
                                <i class="fas fa-graduation-cap" style="font-size: 40px;"></i>
                                <h2 style="margin-top: 10px; color: #333;">Verification Required</h2>
                            </div>
                            <p style="color: #333;">Hello,</p>
                            <p style="color: #555; line-height: 1.6;">For your security, please verify your account using the code below:</p>
                            <div style="text-align: center; margin: 35px 0;">
                                <h1 style="font-size: 48px; letter-spacing: 10px; color: #4a90e2; background: #f4f7f9; padding: 20px; border-radius: 8px; display: inline-block;">${newPin}</h1>
                            </div>
                            <p style="font-size: 0.8rem; color: #888; text-align: center;">Note: Verification is required every 14 days.</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;">
                            <p style="color: #555;">Regards,<br><strong>Atlas Admissions Team</strong></p>
                        </div>`
                }
            });

            return { status: "VERIFY" };
        }

        return { status: "SUCCESS" };

    } catch (error) {
        throw new HttpsError('internal', error.message);
    }
});

// ============================================================
// ROLE: Student
// FILE: Login.js (Verification Pin Confirmation Section)
// PURPOSE: Securely compares entered PIN and flips 'isVerified' 
// status to true in the Database using Admin SDK.
// ============================================================
exports.verifyLoginPin = onCall({ maxInstances: 10 }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, enteredPin } = request.data;

    try {
        const userRef = admin.firestore().collection("users").doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'User record not found.');
        }

        const userData = userDoc.data();

        // Server-side comparison (Invisible to users)
        if (userData.verificationPin === enteredPin) {
            await userRef.update({
                isVerified: true,
                lastVerifiedAt: new Date() 
            });
            return { success: true };
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
// FILE: Login.js (Resend Verification PIN Section)
// PURPOSE: Securely generates a new PIN, enforces the 30-second cooldown 
// via server-side data, and transmits the new email message natively.
// ============================================================
exports.resendLoginPin = onCall({ maxInstances: 10 }, async (request) => {
    if (!request.auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid } = request.data;

    try {
        const userRef = admin.firestore().collection("users").doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            throw new HttpsError('not-found', 'User not found.');
        }

        const userData = userDoc.data();
        const now = Date.now();
        const cooldown = 30000; // 30 seconds

        // Cooldown check using server-side data
        if (userData.lastPinSentAt) {
            const lastSent = userData.lastPinSentAt.toDate().getTime();
            if (now - lastSent < cooldown) {
                const secondsLeft = Math.ceil((cooldown - (now - lastSent)) / 1000);
                return { 
                    success: false, 
                    status: "COOLDOWN", 
                    secondsLeft: secondsLeft 
                };
            }
        }

        const newPin = Math.floor(100000 + Math.random() * 900000).toString();
        
        await userRef.update({ 
            verificationPin: newPin,
            lastPinSentAt: new Date()
        });

        // Natively handle the resend email generation on the server to block client manipulation
        await admin.firestore().collection("mail").add({
            to: userData.email,
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

        return { success: true };

    } catch (error) {
        console.error("Resend PIN Error:", error);
        throw new HttpsError('internal', error.message);
    }
});
