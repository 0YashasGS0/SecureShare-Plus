// ===== CREATE-NOTE.JS - Handle note creation and encryption =====

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('createNoteForm');
    const noteContent = document.getElementById('noteContent');
    const charCount = document.getElementById('charCount');
    const linkResult = document.getElementById('linkResult');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const createAnotherBtn = document.getElementById('createAnotherBtn');

    // Character counter
    noteContent.addEventListener('input', function () {
        charCount.textContent = noteContent.value.length;
    });

    // Face Auth State
    let faceEmbedding = null;
    let isFaceAuthEnabled = false;

    // Toggle Face Auth
    const faceToggle = document.getElementById('requireFaceAuth');
    if (faceToggle) {
        faceToggle.addEventListener('change', function () {
            isFaceAuthEnabled = this.checked;
        });
    }

    // Modal Elements
    const faceModal = document.getElementById('faceCaptureModal');
    const faceVideo = document.getElementById('faceVideo');
    const captureBtn = document.getElementById('captureFaceBtn');
    const cancelBtn = document.getElementById('cancelFaceBtn');

    // Handle Cancel
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            faceModal.style.display = 'none';
            stopCamera(faceVideo);
            // Uncheck toggle if cancelled without capture
            if (!faceEmbedding) {
                faceToggle.checked = false;
                isFaceAuthEnabled = false;
            }
        });
    }

    // Handle Capture
    if (captureBtn) {
        captureBtn.addEventListener('click', async function () {
            try {
                captureBtn.disabled = true;

                // 1. Ensure models are loaded (Update text)
                if (!isModelsLoaded()) {
                    captureBtn.innerHTML = '<span class="btn-icon">🧠</span> Loading Models...';
                    await loadFaceModels();
                }

                // 2. Analyze
                captureBtn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing Face...';

                // Capture descriptor
                const descriptor = await captureFaceDescriptor(faceVideo);
                faceEmbedding = descriptorToString(descriptor);

                console.log('✅ Face captured:', faceEmbedding.length);

                // Close modal
                stopCamera(faceVideo);
                faceModal.style.display = 'none';
                showToast('✅ Face reference captured', 'success');

                // Reset button
                captureBtn.innerHTML = '<span class="btn-icon">📸</span> Capture Face';
                captureBtn.disabled = false;

            } catch (error) {
                console.error(error);
                showToast('❌ ' + error.message, 'error');
                captureBtn.innerHTML = '<span class="btn-icon">📸</span> Capture Face';
                captureBtn.disabled = false;
            }
        });
    }

    // Form submission - Encrypt and generate link
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // If Face Auth enabled but no face captured, show modal
        if (isFaceAuthEnabled && !faceEmbedding) {
            faceModal.style.display = 'flex';
            await loadFaceModels(); // Pre-load
            await startCamera(faceVideo);
            return; // Stop submission until captured
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Encrypting...';

            // Get form data
            const noteText = noteContent.value.trim();
            const recipientEmail = document.getElementById('recipientEmail').value.trim();
            const expiryMinutes = parseInt(document.getElementById('expiryTime').value);
            const attemptLimit = parseInt(document.getElementById('attemptLimit').value);
            const viewOnce = document.getElementById('viewOnce').checked;

            if (!noteText) {
                throw new Error('Please enter a message');
            }

            // Generate encryption key
            const encryptionKey = await generateEncryptionKey();

            // Encrypt the note
            const { ciphertext, iv } = await encryptText(noteText, encryptionKey);

            // Export key to base64 for URL
            const keyBase64 = await exportKey(encryptionKey);

            // Encrypt Face Data if exists
            let faceParam = '';
            if (isFaceAuthEnabled && faceEmbedding) {
                // Encrypt the embedding string using the SAME key
                // We use a different IV or just encrypt it as text
                const encryptedFace = await encryptText(faceEmbedding, encryptionKey);
                // We need to pass IV too. 
                // Format: iv:ciphertext
                const faceString = `${encryptedFace.iv}:${encryptedFace.ciphertext}`;
                faceParam = `&face=${encodeURIComponent(faceString)}`;
            }

            // Generate unique note ID (in production, this comes from server)
            // Generate unique note ID (in production, this comes from server)
            // const noteId = generateNoteId();

            // Prepare note metadata
            const payload = {
                encryptedContent: ciphertext,
                iv: iv,
                expiryMinutes: expiryMinutes,
                viewOnce: viewOnce,
                attemptLimit: attemptLimit // ADDED: Send attempt limit to backend
            };

            // Get token
            const token = localStorage.getItem('authToken');
            if (!token) {
                showToast('Please login to create notes', 'error');
                setTimeout(() => window.location.href = 'login.html', 1500);
                return;
            }

            // Send to backend
            const response = await fetch('/api/notes/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create note');
            }

            const noteId = data.noteId;

            console.log('📦 Note created on server. ID:', noteId);
            console.log('🔑 Encryption key (stays in URL fragment):', keyBase64);

            // Generate shareable link
            // Key is in URL fragment (#) so it never goes to server
            const shareLink = `${window.location.origin}/view-note.html?id=${noteId}#key=${keyBase64}${faceParam}`;

            // Display result
            displayGeneratedLink(shareLink, expiryMinutes, viewOnce);

            // Hide form, show result
            form.style.display = 'none';
            linkResult.style.display = 'block';

            showToast('✅ Note encrypted successfully!', 'success');

        } catch (error) {
            console.error('Error creating note:', error);
            showToast('❌ Failed to create note: ' + error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    // Copy link button
    copyLinkBtn.addEventListener('click', function () {
        const linkInput = document.getElementById('generatedLink');
        linkInput.select();
        document.execCommand('copy');

        // Visual feedback
        copyLinkBtn.textContent = '✅ Copied!';
        setTimeout(() => {
            copyLinkBtn.textContent = '📋 Copy';
        }, 2000);

        showToast('Link copied to clipboard!', 'success');
    });

    // Create another note button
    createAnotherBtn.addEventListener('click', function () {
        // Reset form
        form.reset();
        charCount.textContent = '0';
        form.style.display = 'block';
        linkResult.style.display = 'none';

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-icon">🔐</span> Encrypt & Generate Link';
    });
});

/**
 * Display generated link with details
 */
function displayGeneratedLink(link, expiryMinutes, viewOnce) {
    document.getElementById('generatedLink').value = link;

    // Calculate expiry time
    const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);
    const expiryDisplay = formatExpiryTime(expiryMinutes, expiryDate);
    document.getElementById('expiryDisplay').textContent = expiryDisplay;

    // View once status
    document.getElementById('viewOnceDisplay').textContent = viewOnce ? 'Yes ⚠️' : 'No';
}

/**
 * Format expiry time for display
 */
function formatExpiryTime(minutes, date) {
    if (minutes < 60) {
        return `${minutes} minutes (${date.toLocaleTimeString()})`;
    } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60);
        return `${hours} hour${hours > 1 ? 's' : ''} (${date.toLocaleString()})`;
    } else {
        const days = Math.floor(minutes / 1440);
        return `${days} day${days > 1 ? 's' : ''} (${date.toLocaleDateString()})`;
    }
}

/**
 * Generate random note ID
 * (In production, this is generated by server)
 */
function generateNoteId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    for (let i = 0; i < 12; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}
