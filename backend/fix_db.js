const { pool } = require('./config/database');

async function fixDb() {
    try {
        console.log('🗑️ Dropping trigger after_note_view...');
        await pool.query('DROP TRIGGER IF EXISTS after_note_view');
        console.log('✅ Trigger dropped successfully.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error dropping trigger:', err.message);
        process.exit(1);
    }
}

fixDb();
