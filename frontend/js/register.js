// ===== REGISTER.JS - Registration page logic =====

let biometricEnrolled = false;

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('registerForm');
    const enrollBtn = document.getElementById('enrollBiometricBtn');
    const submitBtn = document.getElementById('submitBtn');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const emailInput = document.getElementById('email');

    // Enable biometric button after email is entered
    emailInput.addEventListener('input', function () {
        if (emailInput.value.includes('@')) {
            enrollBtn.disabled = false;
        } else {
            enrollBtn.disabled = true;
        }
    });

    // Biometric enrollment
    enrollBtn.addEventListener('click', async function () {
        const email = emailInput.value;
        if (!email) {
            showBiometricStatus('Please enter your email first', 'error');
            return;
        }

        try {
            showBiometricStatus('Please use your fingerprint or Face ID...', 'info');
            enrollBtn.disabled = true;
            enrollBtn.textContent = 'Enrolling...';

            // Call biometric enrollment (from biometric.js)
            await enrollBiometric(email);

            biometricEnrolled = true;
            showBiometricStatus('✅ Biometric enrolled successfully!', 'success');
            enrollBtn.textContent = '✓ Enrolled';
            enrollBtn.style.background = '#10b981';

            // Enable submit button
            submitBtn.disabled = false;

        } catch (error) {
            console.error('Biometric enrollment failed:', error);
            showBiometricStatus('❌ Enrollment failed: ' + error.message, 'error');
            enrollBtn.disabled = false;
            enrollBtn.innerHTML = '<span class="btn-icon">🔐</span> Retry Enrollment';
        }
    });

    // Form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        if (!biometricEnrolled) {
            showToast('Please enroll biometrics first', 'error');
            return;
        }

        // Get form data
        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';

        try {
            // Send to backend API
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    biometricHash: 'simulated-bio-hash' // In real app, this comes from WebAuthn
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }

            // showToast('Account created successfully! 🎉', 'success');
            showToast('Account created! Please login.', 'success');

            // Redirect to login page after 2 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            showToast(error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    });

    // Real-time password validation
    confirmPasswordInput.addEventListener('input', function () {
        if (confirmPasswordInput.value && passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity('Passwords do not match');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    });
});

/**
 * Validate registration form
 */
function validateForm() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Check name
    if (name.length < 2) {
        showToast('Please enter your full name', 'error');
        return false;
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showToast('Please enter a valid email address', 'error');
        return false;
    }

    // Check password strength
    if (password.length < 8) {
        showToast('Password must be at least 8 characters', 'error');
        return false;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        showToast('Password must contain letters and numbers', 'error');
        return false;
    }

    // Check password match
    if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return false;
    }

    return true;
}

/**
 * Show biometric status message
 */
function showBiometricStatus(message, type) {
    const statusDiv = document.getElementById('biometricStatus');
    statusDiv.textContent = message;
    statusDiv.className = 'biometric-status ' + type;
    statusDiv.style.display = 'block';
}
