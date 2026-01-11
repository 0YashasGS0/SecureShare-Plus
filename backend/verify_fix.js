const fetch = require('node-fetch'); // Try node-fetch if available, otherwise native fetch might work
// If node-fetch fails, we will assume native fetch is available (Node 18+)

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
    console.log('🧪 Starting Burn After Reading Verification Test...');

    try {
        // 1. Register/Login User
        const user = {
            name: 'Test Verify',
            email: `test_${Date.now()}@example.com`,
            password: 'password123'
        };

        console.log(`👤 Registering user: ${user.email}`);
        let res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        // If user exists, that's fine, just login
        if (res.status !== 201 && res.status !== 400) {
            throw new Error(`Registration failed: ${res.status}`);
        }

        console.log('🔑 Logging in...');
        res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: user.password })
        });
        if (!res.ok) throw new Error(`Login failed: ${res.status}`);
        const { token } = await res.json();
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. Create Note (ViewOnce = true)
        console.log('📝 Creating ViewOnce note...');
        const noteData = {
            encryptedContent: 'ENCRYPTED_CONTENT_FAKE',
            iv: 'IV_FAKE',
            expiryMinutes: 10,
            viewOnce: true
        };
        res = await fetch(`${BASE_URL}/notes/create`, {
            method: 'POST',
            headers,
            body: JSON.stringify(noteData)
        });
        if (!res.ok) throw new Error(`Create note failed: ${res.status}`);
        const { noteId } = await res.json();
        console.log(`   Note Created: ${noteId}`);

        // 3. Fetch PREVIEW (Should NOT burn)
        console.log('👀 Fetching PREVIEW (Step 1)...');
        res = await fetch(`${BASE_URL}/notes/${noteId}?type=preview`, { headers });
        if (!res.ok) throw new Error(`Preview fetch failed: ${res.status}`);
        let data = await res.json();

        if (data.encryptedContent) throw new Error('Preview returned encryptedContent! FAIL');
        if (data.viewCount > 0) throw new Error(`Preview incremented viewCount to ${data.viewCount}! FAIL`);
        console.log('   Preview OK (No content, ViewCount=0)');

        // 4. Fetch PREVIEW Again (Should still exist)
        console.log('👀 Fetching PREVIEW Again (Step 2)...');
        res = await fetch(`${BASE_URL}/notes/${noteId}?type=preview`, { headers });
        if (!res.ok) throw new Error(`Second preview failed: ${res.status} - Note might have been burnt!`);
        console.log('   Second Preview OK');

        // 5. Fetch CONTENT (Should burn after this)
        console.log('🔥 Fetching FULL CONTENT (Step 3)...');
        res = await fetch(`${BASE_URL}/notes/${noteId}`, { headers });
        if (!res.ok) throw new Error(`Content fetch failed: ${res.status}`);
        data = await res.json();

        if (!data.encryptedContent) throw new Error('Content fetch missing encryptedContent! FAIL');
        console.log('   Content Fetch OK');

        // 6. Fetch CONTENT Again (Should be GONE)
        console.log('🚫 Fetching CONTENT Again (Should fail)...');
        res = await fetch(`${BASE_URL}/notes/${noteId}`, { headers });
        if (res.status === 404 || res.status === 410) {
            console.log(`   Success! Note is gone (Status: ${res.status})`);
        } else {
            throw new Error(`Note still exists! Status: ${res.status}`);
        }

        console.log('✅ TEST PASSED: Burn After Reading fixed!');

    } catch (error) {
        console.error('❌ TEST FAILED:', error.message);
    }
}

// Check for node-fetch or use native
if (typeof fetch === 'undefined') {
    // try to require it, if fails, assume native in newer node or fail
    try {
        global.fetch = require('node-fetch');
        runTest();
    } catch (e) {
        console.log("Could not load node-fetch, assuming native fetch...");
        runTest();
    }
} else {
    runTest();
}
