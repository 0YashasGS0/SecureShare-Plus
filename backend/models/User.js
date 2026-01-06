const { pool } = require('../config/database');

exports.findByEmail = async email => {
  const [rows] = await pool.query("SELECT * FROM Users WHERE Email=?", [email]);
  return rows[0] || null;
};
// Add other reusable functions as needed
