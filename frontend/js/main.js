// ===== MAIN.JS - General UI interactions and utilities =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('SecureShare+ loaded successfully');
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Check if browser supports required APIs
    checkBrowserSupport();
});

/**
 * Check if browser supports Web Crypto API and WebAuthn
 * Shows warning if features are missing
 */
function checkBrowserSupport() {
    const warnings = [];
    
    // Check Web Crypto API (for encryption)
    if (!window.crypto || !window.crypto.subtle) {
        warnings.push('Web Crypto API not supported');
    }
    
    // Check WebAuthn (for biometrics)
    if (!window.PublicKeyCredential) {
        warnings.push('WebAuthn not supported (biometric login unavailable)');
    }
    
    // Check if running on HTTPS (required for WebAuthn)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        warnings.push('HTTPS required for full security features');
    }
    
    if (warnings.length > 0) {
        console.warn('Browser compatibility issues:', warnings);
        // You can show a visual warning banner here
    } else {
        console.log('✅ All security features supported');
    }
}

/**
 * Utility: Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', or 'info'
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
    }
`;
document.head.appendChild(style);
