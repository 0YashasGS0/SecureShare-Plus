const cron = require('node-cron');
const { pool } = require('../config/database');

const setupCleanupJob = () => {
    // Run every minute to check for expired notes
    cron.schedule('* * * * *', async () => {
        try {
            const [result] = await pool.query(
                "UPDATE Notes SET IsDeleted=TRUE WHERE ExpiryTime < NOW() AND IsDeleted=FALSE"
            );
            if (result.affectedRows > 0) {
                console.log(`🧹 Cleanup: Marked ${result.affectedRows} expired notes as deleted.`);
            }
        } catch (error) {
            console.error('❌ Cleanup Job Error:', error.message);
        }
    });
    console.log('🕒 Cleanup job scheduled (checks every minute).');
};

module.exports = setupCleanupJob;
