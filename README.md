# PrivNote+ 🛡️

A secure, self-destructing note sharing application with biometric authentication and end-to-end encryption.

## Features
- **Biometric Authentication**: Secure access using FaceID/TouchID (WebAuthn).
- **End-to-End Encryption**: AES-256-GCM encryption ensures only the intended recipient can read the note.
- **Self-Destructing Notes**: "View Once" notes are permanently deleted after reading.
- **Face Authentication**: Optional sender-enforced face verification for recipients.
- **Time-Limited Access**: Set expiration times for notes.
- **Password Protection**: Encrypted password manager (Beta).

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (Premium UI)
- **Backend**: Node.js, Express.js
- **Database**: MySQL
- **Security**: Web Crypto API, bcrypt, JSON Web Tokens (JWT)

## Prerequisites
- Node.js (v14 or higher)
- MySQL Server

## Installation & Setup

### 1. Database Setup
1.  Create a MySQL database named `secureshare_db`.
2.  Import the schema from `backend/database/schema.sql`.
    ```sql
    SOURCE backend/database/schema.sql;
    ```

### 2. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure Environment:
    - Copy `.env.example` to `.env`:
      ```bash
      cp .env.example .env
      ```
    - Update `.env` with your database credentials (`DB_USER`, `DB_PASSWORD`).

4.  Start the Server:
    ```bash
    npm run dev
    ```
    - Server runs on: `http://localhost:5000`

### 3. Frontend Setup
The backend is configured to serve the frontend static files automatically.
simply access the application at:
**http://localhost:5000**

> **Note**: Do not open `index.html` directly in the browser (file:// protocol) as some security features (WebAuthn) require a valid HTTP(S) origin.

## Usage
1.  **Register/Login**: Create an account to start sharing notes.
2.  **Create Note**: Enter your secret message, set expiry options, and toggle "View Once" or "Face Auth" if desired.
3.  **Share Link**: Send the generated link to the recipient.
4.  **View Note**: The recipient clicks the link, verifies their identity (if required), and reads the message.

## Project Status
✅ **Active Development** - PrivNote+ Rebrand & UI Upgrade Complete.
