const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp();
}

// ============================================================
// ROLE: Student
// FILE: Register.js
// PURPOSE: Import logic from register role files
// ============================================================

const register = require("./role/register");

// EXPORT them so Firebase can deploy them
// We keep the names exactly the same so your Register.js frontend doesn't break
exports.initializeStudentProfile = register.initializeStudentProfile;
exports.verifyStudentPin = register.verifyStudentPin;
exports.resendStudentPin = register.resendStudentPin;
exports.checkDuplicateStudent = register.checkDuplicateStudent;

// ============================================================
// ROLE: Student
// FILE: Login.js
// PURPOSE: Import logic from login role files
// ============================================================

const login = require("./role/login");

exports.processLoginSecurity = login.processLoginSecurity;
exports.verifyLoginPin = login.verifyLoginPin;
exports.resendLoginPin = login.resendLoginPin;
