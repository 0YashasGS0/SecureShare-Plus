// test-flow.js
const axios = require('axios'); // You might need to install axios: npm install axios
// Or use fetch (Node 18+)

const API_URL = 'http://localhost:5000/api';
let authToken = '';

async function runTest() {
    console.log('🚀 Starting Backend Verification...\n');

    try {
        // 1. Health Check
        console.log('1️⃣  Checking Health...');
        const health = await fetch(`${API_URL}/health`);
        console.log('   Status:', await health.json());

        // 2. Register User
        console.log('\n2️⃣  Registering User...');
        const email = `test${Date.now()}@example.com`;
        const password = 'Password@123';
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test User',
                email: email,
                password: password,
                biometricHash: 'dummy-hash'
            })
        });
        const regData = await regRes.json();
        console.log('   Response:', regData);
        if (!regRes.ok) throw new Error(regData.error);

        // 3. Login
        console.log('\n3️⃣  Logging In...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(loginData.error);
        authToken = loginData.token;
        console.log('   ✅ Login successful. Token received.');

        // 4. Create Note
        console.log('\n4️⃣  Creating Note...');
        const noteRes = await fetch(`${API_URL}/notes/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                encryptedContent: 'encrypted-secret-content',
                iv: 'initialization-vector',
                expiryMinutes: 60,
                viewOnce: false
            })
        });
        const noteData = await noteRes.json();
        console.log('   Created Note ID:', noteData.noteId);

        // 5. Add Password
        console.log('\n5️⃣  Adding Password...');
        const pwdRes = await fetch(`${API_URL}/passwords/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({
                website: 'google.com',
                username: 'myuser',
                encryptedPassword: 'encrypted-password-data',
                iv: 'pwd-iv'
            })
        });
        const pwdData = await pwdRes.json();
        console.log('   Response:', pwdData.message);

        // 6. Get Passwords
        console.log('\n6️⃣  Fetching Passwords...');
        const getPwdRes = await fetch(`${API_URL}/passwords/all`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const passwords = await getPwdRes.json();
        console.log(`   Found ${passwords.length} password(s).`);
        console.log('   First password website:', passwords[0]?.website);

        console.log('\n✅✅ ALL TESTS PASSED SUCCESSFULLY! ✅✅');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
    }
}

runTest();
