const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
    console.log('🧪 Starting Non-ViewOnce Bug Reproduction...');

    try {
        // 1. Register/Login User
        const user = {
            name: 'Test Repro',
            email: `repro_${Date.now()}@example.com`,
            password: 'password123'
        };

        let res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: user.password })
        });
        const { token } = await res.json();
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. Create Normal Note (ViewOnce = FALSE)
        console.log('📝 Creating Normal Note (ViewOnce=FALSE)...');
        const noteData = {
            encryptedContent: 'NORMAL_CONTENT',
            iv: 'IV_NORMAL',
            expiryMinutes: 10,
            viewOnce: false   // <--- IMPORTANT
        };
        res = await fetch(`${BASE_URL}/notes/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify(noteData)
        });
        const { noteId } = await res.json();
        console.log(`   Note Created: ${noteId}`);

        // 3. Fetch PREVIEW (Should accept)
        console.log('👀 Fetching PREVIEW...');
        res = await fetch(`${BASE_URL}/notes/${noteId}?type=preview`, { headers });
        if (!res.ok) throw new Error('Preview fetch failed');
        console.log('   Preview OK');

        // 4. Fetch CONTENT (First View)
        console.log('📖 Fetching CONTENT (View 1)...');
        res = await fetch(`${BASE_URL}/notes/${noteId}`, { headers });
        if (!res.ok) throw new Error(`First content fetch failed: ${res.status}`);
        console.log('   Content Fetch 1 OK');

        // 5. Fetch CONTENT Again (Second View - Should still exist!)
        console.log('📖 Fetching CONTENT Again (View 2)...');
        res = await fetch(`${BASE_URL}/notes/${noteId}`, { headers });

        if (res.status === 404 || res.status === 410) {
            throw new Error('❌ BUG REPRODUCED: Normal note was deleted after 1 view!');
        } else if (!res.ok) {
            throw new Error(`Second fetch failed with unexpected status: ${res.status}`);
        } else {
            console.log('✅ Success: Normal note still exists.');
        }

    } catch (error) {
        console.error(error.message);
    }
}

// Check for node-fetch or use native
if (typeof fetch === 'undefined') {
    try {
        global.fetch = require('node-fetch');
        runTest();
    } catch (e) {
        runTest();
    }
} else {
    runTest();
}
