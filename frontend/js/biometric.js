// ===== BIOMETRIC.JS - WebAuthn biometric authentication =====

/**
 * Enroll user's biometric (fingerprint/Face ID)
 * @param {string} userEmail - User's email as identifier
 * @returns {Promise} - Resolves when enrollment succeeds
 */
async function enrollBiometric(userEmail) {
    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
    }

    try {
        // Generate challenge (in production, this comes from server)
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        // Create credential options
        const publicKeyCredentialCreationOptions = {
            challenge: challenge,
            rp: {
                name: "SecureShare+",
                id: window.location.hostname
            },
            user: {
                id: Uint8Array.from(userEmail, c => c.charCodeAt(0)),
                name: userEmail,
                displayName: userEmail.split('@')[0]
            },
            pubKeyCredParams: [
                { alg: -7, type: "public-key" },  // ES256
                { alg: -257, type: "public-key" } // RS256
            ],
            authenticatorSelection: {
                authenticatorAttachment: "platform", // Use device biometrics
                userVerification: "required",
                requireResidentKey: false
            },
            timeout: 60000,
            attestation: "none"
        };

        // Request biometric enrollment
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });

        console.log('✅ Biometric credential created:', credential);

        // Store credential ID (in production, send to server)
        localStorage.setItem('biometric_credential_id', 
            btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
        
        localStorage.setItem('biometric_user_email', userEmail);

        return credential;

    } catch (error) {
        console.error('Biometric enrollment error:', error);
        
        if (error.name === 'NotAllowedError') {
            throw new Error('Biometric access denied or cancelled');
        } else if (error.name === 'NotSupportedError') {
            throw new Error('Biometric authentication not available on this device');
        } else {
            throw new Error('Failed to enroll biometric: ' + error.message);
        }
    }
}

/**
 * Verify user's biometric for login/access
 * @param {string} userEmail - User's email
 * @returns {Promise} - Resolves when verification succeeds
 */
async function verifyBiometric(userEmail) {
    if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported');
    }

    try {
        // Generate challenge
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);

        // Get stored credential ID
        const credentialId = localStorage.getItem('biometric_credential_id');
        if (!credentialId) {
            throw new Error('No biometric enrollment found');
        }

        // Convert credential ID back to ArrayBuffer
        const credentialIdBuffer = Uint8Array.from(atob(credentialId), c => c.charCodeAt(0));

        // Create assertion options
        const publicKeyCredentialRequestOptions = {
            challenge: challenge,
            allowCredentials: [{
                id: credentialIdBuffer,
                type: 'public-key',
                transports: ['internal']
            }],
            userVerification: "required",
            timeout: 60000
        };

        // Request biometric verification
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });

        console.log('✅ Biometric verified:', assertion);
        return assertion;

    } catch (error) {
        console.error('Biometric verification error:', error);
        
        if (error.name === 'NotAllowedError') {
            throw new Error('Biometric verification cancelled');
        } else {
            throw new Error('Verification failed: ' + error.message);
        }
    }
}
