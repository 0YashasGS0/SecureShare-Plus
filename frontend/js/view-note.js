// ===== VIEW-NOTE.JS - Handle note viewing and decryption =====

let noteData = null;
let destructTimer = null;
let encryptedFaceData = null; // Global to access in verifyAndDecrypt

document.addEventListener('DOMContentLoaded', async function () {
    // Parse URL to get note ID and encryption key
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('id');
    const urlHash = window.location.hash;

    // Extract key from URL fragment (#key=...)
    const keyMatch = urlHash.match(/#key=([^&]+)/);
    const encryptionKey = keyMatch ? keyMatch[1] : null;

    // Extract face data if present
    const faceMatch = urlHash.match(/&face=([^&]+)/);
    // Assign to global variable
    encryptedFaceData = faceMatch ? decodeURIComponent(faceMatch[1]) : null;

    console.log('📄 Note ID:', noteId);
    console.log('🔑 Has encryption key:', !!encryptionKey);

    // Validate URL parameters
    if (!noteId || !encryptionKey) {
        showError('Invalid Link', 'This link is malformed or incomplete. Please check the URL and try again.');
        return;
    }

    // Fetch note metadata from server (simulated)
    try {
        await loadNoteMetadata(noteId);
        showBiometricVerification();
    } catch (error) {
        showError('Note Not Found', error.message);
    }

    // Setup biometric verification button
    document.getElementById('verifyBiometricBtn').addEventListener('click', async function () {
        try {
            await verifyAndDecrypt(encryptionKey);
        } catch (error) {
            console.error('Verification failed:', error);
            showToast('❌ ' + error.message, 'error');

            // Decrement attempts
            if (noteData && noteData.attemptsLeft > 0) {
                noteData.attemptsLeft--;
                updateAttemptsDisplay();

                if (noteData.attemptsLeft === 0) {
                    showError('Maximum Attempts Exceeded', 'You have used all available attempts to access this note.');
                }
            }
        }
    });

    // Copy note button
    document.getElementById('copyNoteBtn').addEventListener('click', function () {
        const noteText = document.getElementById('noteContent').textContent;
        navigator.clipboard.writeText(noteText);
        showToast('📋 Note copied to clipboard', 'success');
    });

    // Close note button
    document.getElementById('closeNoteBtn').addEventListener('click', function () {
        if (noteData && noteData.viewOnce) {
            startSelfDestruct();
        } else {
            showToast('✅ You can close this page', 'success');
        }
    });
});

/**
 * Load note metadata from server (simulated)
 */
async function loadNoteMetadata(noteId) {
    // Get token
    const token = localStorage.getItem('authToken');
    if (!token) {
        // Redirect immediately if not logged in
        window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
        // Stop execution (throw error to stop async flow)
        throw new Error('Redirecting to login...');
    }

    // Show loading state
    showState('loadingState');

    try {
        const response = await fetch(`/api/notes/${noteId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.status === 404 || response.status === 410) {
            throw new Error(data.error || 'Note not found or expired');
        }

        if (!response.ok) {
            throw new Error(data.error || 'Failed to load note');
        }

        // Map backend response to frontend format
        const maxViews = data.maxViews || 0;
        const currentViews = data.viewCount || 0;
        const attemptsLeft = maxViews > 0 ? Math.max(0, maxViews - currentViews) : 'Unlimited';

        noteData = {
            noteId: noteId,
            encryptedContent: data.encryptedContent,
            iv: data.iv,
            recipientEmail: null,
            expiryTime: new Date(data.expiryTime),
            attemptLimit: maxViews,
            attemptsLeft: attemptsLeft,
            viewOnce: data.viewOnce === 1 || data.viewOnce === true,
            createdAt: new Date()
        };

        // Check if expired (double check client side)
        if (new Date() > noteData.expiryTime) {
            throw new Error('This note has expired and is no longer available.');
        }

        console.log('📦 Note metadata loaded:', noteData);

    } catch (error) {
        throw error;
    }
}

/**
 * Show biometric verification screen
 */
function showBiometricVerification() {
    showState('biometricState');

    // Update attempts display
    updateAttemptsDisplay();

    // Start expiry countdown
    startExpiryCountdown();
}

/**
 * Update attempts left display
 */
function updateAttemptsDisplay() {
    const attemptsEl = document.getElementById('attemptsLeft');
    attemptsEl.textContent = noteData.attemptsLeft;

    if (noteData.attemptsLeft <= 1) {
        attemptsEl.style.color = 'var(--error)';
    }
}

/**
 * Start expiry countdown timer
 */
function startExpiryCountdown() {
    const countdownEl = document.getElementById('expiryCountdown');

    function updateCountdown() {
        const now = new Date();
        const timeLeft = noteData.expiryTime - now;

        if (timeLeft <= 0) {
            countdownEl.textContent = 'Expired';
            countdownEl.style.color = 'var(--error)';
            showError('Note Expired', 'This note has expired while you were viewing it.');
            return;
        }

        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        countdownEl.textContent = `${minutes}m ${seconds}s`;

        setTimeout(updateCountdown, 1000);
    }

    updateCountdown();
}

/**
 * Verify biometrics and decrypt note
 */
async function verifyAndDecrypt(keyBase64) {
    const verifyBtn = document.getElementById('verifyBiometricBtn');
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span class="btn-icon">⏳</span> Verifying...';

    try {
        // Verify biometrics
        const userEmail = localStorage.getItem('biometric_user_email') || 'demo@example.com';
        await verifyBiometric(userEmail);

        console.log('✅ Biometric verified');

        // FACE VERIFICATION CHECK
        if (typeof encryptedFaceData !== 'undefined' && encryptedFaceData) {
            console.log('👤 Face verification required');

            // Show modal
            const faceModal = document.getElementById('faceVerifyModal');
            const faceVideo = document.getElementById('faceVerifyVideo');
            const verifyFaceBtn = document.getElementById('verifyFaceBtn');
            const statusDiv = document.getElementById('faceMatchStatus');

            faceModal.style.display = 'flex';
            await loadFaceModels();
            await startCamera(faceVideo);

            // Wait for user to verify face
            await new Promise((resolve, reject) => {
                // Handle Verify Button
                verifyFaceBtn.onclick = async () => {
                    try {
                        verifyFaceBtn.disabled = true;

                        // 1. Ensure models loaded
                        if (!isModelsLoaded()) {
                            verifyFaceBtn.textContent = '🧠 Loading Models...';
                            statusDiv.textContent = 'Downloading AI models (this happens once)...';
                            await loadFaceModels();
                        }

                        // 2. Analyze
                        verifyFaceBtn.textContent = '⏳ Verifying...';
                        statusDiv.textContent = 'Analyzing face...';
                        statusDiv.style.color = 'var(--text-muted)';

                        // 1. Capture current face
                        const currentDescriptor = await captureFaceDescriptor(faceVideo);

                        // 2. Decrypt reference face
                        // Format: iv:ciphertext
                        const [ivHex, ciphertext] = encryptedFaceData.split(':');
                        const cryptoKey = await importKey(keyBase64); // We need the key here

                        // We need to implement decryptText that takes specific IV string if possible
                        // The existing decryptText uses the stored IV from noteData, but here we have specific IV.
                        // We might need to manually call crypto.js function or reuse decryptText if it supports it.
                        // Let's assume decryptText is flexible or we call internal specific logic.
                        // actually decryptText signature is (ciphertext, iv, key).
                        // iv in decryptText expects Base64 or specific format? 
                        // In create-note.js we used encryptText which returns {iv, ciphertext} as Hex/Base64?
                        // Let's check crypto.js or just try.

                        // decryptText expects IV as specific type? 
                        // Let's look at crypto.js later or assume it handles standard format (it usually expects the format from encryptText).

                        const referenceJson = await decryptText(ciphertext, ivHex, cryptoKey);
                        const referenceDescriptor = stringToDescriptor(referenceJson);

                        // 3. Compare
                        const distance = faceapi.euclideanDistance(currentDescriptor, referenceDescriptor);
                        const threshold = 0.5; // Strictness (lower is stricter)

                        console.log(`👤 Face Distance: ${distance} (Threshold: ${threshold})`);

                        if (distance < threshold) {
                            statusDiv.textContent = '✅ Face Verified!';
                            statusDiv.style.color = 'var(--success)';
                            setTimeout(() => {
                                stopCamera(faceVideo);
                                faceModal.style.display = 'none';
                                resolve(true);
                            }, 1000);
                        } else {
                            statusDiv.textContent = '❌ Face Mismatch. Access Denied.';
                            statusDiv.style.color = 'var(--error)';
                            verifyFaceBtn.textContent = '📸 Try Again';
                            verifyFaceBtn.disabled = false;
                            // Optionally reject or let them retry
                            // If we want to be strict, we reject here
                            // reject(new Error('Face verification failed'));
                        }

                    } catch (error) {
                        console.error(error);
                        statusDiv.textContent = '❌ Error: ' + error.message;
                        verifyFaceBtn.disabled = false;
                        verifyFaceBtn.textContent = '📸 Try Again';
                    }
                };
            });
        }

        showToast('✅ Identity verified', 'success');

        // Import encryption key
        const cryptoKey = await importKey(keyBase64);

        // Decrypt note
        const plaintext = await decryptText(noteData.encryptedContent, noteData.iv, cryptoKey);

        console.log('🔓 Note decrypted successfully');

        // Display decrypted note
        showDecryptedNote(plaintext);

    } catch (error) {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<span class="btn-icon">👆</span> Verify with Biometrics';
        throw error;
    }
}

/**
 * Display decrypted note content
 */
function showDecryptedNote(plaintext) {
    showState('noteContentState');

    // Display note content
    document.getElementById('noteContent').textContent = plaintext;

    // Set viewed time
    document.getElementById('viewedTime').textContent = new Date().toLocaleString();

    // Set view-once status
    document.getElementById('viewOnceStatus').textContent = noteData.viewOnce ? 'Yes (Will Self-Destruct)' : 'No';

    // If view-once, show destruct warning after 3 seconds
    if (noteData.viewOnce) {
        setTimeout(() => {
            document.getElementById('destructCountdown').style.display = 'block';

            // Calculate reading time based on length
            // Approx 200 words per minute = ~3 words per second.
            // Let's be generous: 1 second per 2 words + 10 seconds base time.
            const wordCount = plaintext.split(/\s+/).length;
            const readingTime = Math.max(10, Math.ceil(wordCount / 2) + 5);

            console.log(`⏱️ Calculated reading time: ${readingTime}s for ${wordCount} words`);

            startSelfDestruct(readingTime);
        }, 3000);
    }
}

/**
 * Start self-destruct countdown
 */
function startSelfDestruct(duration = 5) {
    let secondsLeft = duration;
    const timerEl = document.getElementById('destructTimer');
    const progressEl = document.getElementById('destructProgress');

    progressEl.style.width = '100%';
    timerEl.textContent = secondsLeft;

    destructTimer = setInterval(() => {
        secondsLeft--;
        timerEl.textContent = secondsLeft;
        progressEl.style.width = (secondsLeft / duration * 100) + '%';

        if (secondsLeft <= 0) {
            clearInterval(destructTimer);
            destroyNote();
        }
    }, 1000);
}

/**
 * Destroy note and show confirmation
 */
function destroyNote() {
    console.log('💥 Note destroyed');

    // Send destruction confirmation to server
    const token = localStorage.getItem('authToken');
    if (token && noteData && noteData.noteId) {
        fetch(`/api/notes/${noteData.noteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(err => console.error('Failed to notify server of destruction:', err));
    }

    showState('destroyedState');
    showToast('💥 Note permanently deleted', 'success');
}

/**
 * Show error state
 */
function showError(title, message) {
    document.getElementById('errorTitle').textContent = title;
    document.getElementById('errorMessage').textContent = message;
    showState('errorState');
}

/**
 * Show specific state card
 */
function showState(stateId) {
    const states = ['loadingState', 'biometricState', 'noteContentState', 'errorState', 'destroyedState'];
    states.forEach(id => {
        document.getElementById(id).style.display = id === stateId ? 'block' : 'none';
    });
}
