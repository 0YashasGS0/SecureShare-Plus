// ===== CRYPTO.JS - Client-side encryption using Web Crypto API =====

/**
 * Generate a random encryption key
 * @returns {Promise<CryptoKey>}
 */
async function generateEncryptionKey() {
    return await window.crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true, // extractable
        ["encrypt", "decrypt"]
    );
}

/**
 * Encrypt text using AES-256-GCM
 * @param {string} plaintext - Text to encrypt
 * @param {CryptoKey} key - Encryption key
 * @returns {Promise<{ciphertext: string, iv: string}>}
 */
async function encryptText(plaintext, key) {
    try {
        // Generate random IV (Initialization Vector)
        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        
        // Convert plaintext to bytes
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);
        
        // Encrypt
        const encrypted = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            data
        );
        
        // Convert to base64 for storage/transmission
        const ciphertext = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        const ivBase64 = btoa(String.fromCharCode(...iv));
        
        return {
            ciphertext: ciphertext,
            iv: ivBase64
        };
    } catch (error) {
        console.error('Encryption failed:', error);
        throw new Error('Failed to encrypt: ' + error.message);
    }
}

/**
 * Decrypt ciphertext using AES-256-GCM
 * @param {string} ciphertext - Base64 encoded ciphertext
 * @param {string} ivBase64 - Base64 encoded IV
 * @param {CryptoKey} key - Decryption key
 * @returns {Promise<string>} - Decrypted plaintext
 */
async function decryptText(ciphertext, ivBase64, key) {
    try {
        // Convert from base64
        const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
        
        // Decrypt
        const decrypted = await window.crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            key,
            ciphertextBytes
        );
        
        // Convert bytes back to text
        const decoder = new TextDecoder();
        return decoder.decode(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        throw new Error('Failed to decrypt: ' + error.message);
    }
}

/**
 * Export key to base64 (for URL fragment)
 * @param {CryptoKey} key
 * @returns {Promise<string>}
 */
async function exportKey(key) {
    const exported = await window.crypto.subtle.exportKey("raw", key);
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

/**
 * Import key from base64
 * @param {string} keyBase64
 * @returns {Promise<CryptoKey>}
 */
async function importKey(keyBase64) {
    const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
    return await window.crypto.subtle.importKey(
        "raw",
        keyBytes,
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    );
}
