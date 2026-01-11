-- SecureShare+ Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Name VARCHAR(100) NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    BiometricHash VARCHAR(512),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastLogin TIMESTAMP NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    INDEX idx_email (Email)
);

-- Notes Table
CREATE TABLE IF NOT EXISTS Notes (
    NoteID VARCHAR(36) PRIMARY KEY,
    UserID INT NOT NULL,
    EncryptedContent TEXT NOT NULL,
    IV VARCHAR(255) NOT NULL,
    Title VARCHAR(200),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ExpiryTime TIMESTAMP NOT NULL,
    ViewOnce BOOLEAN DEFAULT FALSE,
    ViewCount INT DEFAULT 0,
    MaxViews INT DEFAULT 1,
    IsDeleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX idx_expiry (ExpiryTime),
    INDEX idx_user (UserID)
);

-- Shares Table
CREATE TABLE IF NOT EXISTS Shares (
    ShareID INT AUTO_INCREMENT PRIMARY KEY,
    NoteID VARCHAR(36) NOT NULL,
    UserID INT NOT NULL,
    RecipientEmails JSON,
    AccessLink VARCHAR(255) UNIQUE NOT NULL,
    AttemptLimit INT DEFAULT 3,
    CurrentAttempts INT DEFAULT 0,
    TimeWindowStart TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TimeWindowEnd TIMESTAMP NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (NoteID) REFERENCES Notes(NoteID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX idx_link (AccessLink),
    INDEX idx_active (IsActive, TimeWindowEnd)
);

-- AccessLogs Table
CREATE TABLE IF NOT EXISTS AccessLogs (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    ShareID INT NOT NULL,
    NoteID VARCHAR(36) NOT NULL,
    Timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IPHash VARCHAR(64),
    Success BOOLEAN NOT NULL,
    FailReason VARCHAR(100),
    BiometricVerified BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (ShareID) REFERENCES Shares(ShareID) ON DELETE CASCADE,
    FOREIGN KEY (NoteID) REFERENCES Notes(NoteID) ON DELETE CASCADE,
    INDEX idx_timestamp (Timestamp)
);

-- Trigger: Auto-delete notes after view (if ViewOnce = TRUE)

-- Sample data for testing (optional)
-- INSERT INTO Users (Email, Name, PasswordHash) VALUES 
-- ('test@example.com', 'Test User', '$2b$10$abcdefghijklmnopqrstuvwxyz');

-- Passwords Table
CREATE TABLE IF NOT EXISTS Passwords (
    PasswordID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    Website VARCHAR(255) NOT NULL,
    Username VARCHAR(255),
    EncryptedPassword TEXT NOT NULL,
    IV VARCHAR(255) NOT NULL,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX idx_user_web (UserID, Website)
);

