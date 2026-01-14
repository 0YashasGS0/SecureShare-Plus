// ===== LOGIN.JS - Login page logic =====

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('loginForm');
    const submitBtn = document.getElementById('submitBtn');
    const biometricBtn = document.getElementById('biometricLoginBtn');
    const emailInput = document.getElementById('email');

    // Biometric Login
    biometricLoginBtn.addEventListener('click', async function () {
        const email = emailInput.value;
        if (!email) {
            showToast('Please enter your email first to identify you', 'info');
            return;
        }

        try {
            showToast('Please verify your biometrics...', 'info');
            // Check if enrolled
            const storedEmail = localStorage.getItem('biometric_user_email');
            if (storedEmail !== email) {
                // Simple check, real app would check server
                // But for now, we rely on local storage enrollment
            }

            await verifyBiometric(email);

            // If biometric verify succeeds, we autofill password (simulation) or exchange challenge
            // For this MVP, we will just simulate success if they also know the password,
            // OR we can make the backend accept a biometric "token" which we don't have yet.
            // So let's just use it as a 2FA step or visual fancy step for now.

            showToast('✅ Biometric Verified! Please enter password to continue.', 'success');
            // This is a limitation of the current backend not having full WebAuthn challenge response verification implemented yet.

        } catch (error) {
            console.error('Biometric login failed:', error);
            showToast(error.message, 'error');
        }
    });

    // Form submission
    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Store token
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('userEmail', data.email);
            localStorage.setItem('userName', data.name);

            showToast('Login successful!', 'success');

            // Redirect to create note page
            // Redirect
            const urlParams = new URLSearchParams(window.location.search);
            const redirectUrl = urlParams.get('redirect');

            setTimeout(() => {
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                } else {
                    window.location.href = 'create-note.html';
                }
            }, 1000);

        } catch (error) {
            console.error('Login error:', error);
            showToast(error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
        }
    });
});
