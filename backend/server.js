// ===== SERVER.JS - Main Express server =====

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./config/database');
const setupCleanupJob = require('./cron/cleanup');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for frontend (Allow all for local development)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve Frontend Static Files
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ===== ROUTES =====

// ===== ROUTES =====

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'SecureShare+ API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Test database endpoint
app.get('/api/test-db', async (req, res) => {
    const connected = await testConnection();
    res.json({
        database: connected ? 'Connected' : 'Failed',
        timestamp: new Date().toISOString()
    });
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/passwords', require('./routes/passwords'));

// ===== ERROR HANDLING =====

// 404 handler (Serve index.html or 404 json)
app.use((req, res, next) => {
    // If request accepts html, send index.html (SPA support)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
        return;
    }
    // Otherwise send 404 JSON
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ===== START SERVER =====

async function startServer() {
    try {
        // Test database connection first
        const dbConnected = await testConnection();

        if (!dbConnected) {
            console.error('⚠️  Starting server without database connection');
        } else {
            // Start scheduled tasks
            setupCleanupJob();
        }

        // Start listening
        app.listen(PORT, () => {
            console.log('\n🚀 SecureShare+ Backend Server');
            console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`   Server running on: http://localhost:${PORT}`);
            console.log(`   Health check: http://localhost:${PORT}/api/health`);
            console.log(`   Database test: http://localhost:${PORT}/api/test-db\n`);
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Closing server gracefully...');
    process.exit(0);
});

// Start the server
startServer();
