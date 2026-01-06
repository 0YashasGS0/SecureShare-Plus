const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

exports.registerUser = async (req, res) => {
  const { name, email, password, biometricHash } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields required" });
  }
  try {
    const [rows] = await pool.query("SELECT * FROM Users WHERE Email=?", [email]);
    if (rows.length > 0) return res.status(400).json({ error: "User already exists" });

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO Users (Name, Email, PasswordHash, BiometricHash) VALUES (?, ?, ?, ?)", 
      [name, email, hash, biometricHash || null]
    );
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query("SELECT * FROM Users WHERE Email=?", [email]);
    if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });
    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.PasswordHash);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.UserID, email: user.Email }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ token, name: user.Name, email: user.Email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
