const { pool } = require('../config/database');

// Add a new password
exports.addPassword = async (req, res) => {
    const { website, username, encryptedPassword, iv } = req.body;
    const userId = req.user.userId;

    if (!website || !encryptedPassword || !iv) {
        return res.status(400).json({ error: "Website, password, and IV are required" });
    }

    try {
        await pool.query(
            "INSERT INTO Passwords (UserID, Website, Username, EncryptedPassword, IV) VALUES (?, ?, ?, ?, ?)",
            [userId, website, username || null, encryptedPassword, iv]
        );
        res.status(201).json({ message: "Password saved successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all passwords for the user
exports.getPasswords = async (req, res) => {
    const userId = req.user.userId;
    try {
        const [rows] = await pool.query("SELECT * FROM Passwords WHERE UserID=?", [userId]);
        res.json(rows.map(p => ({
            id: p.PasswordID,
            website: p.Website,
            username: p.Username,
            encryptedPassword: p.EncryptedPassword,
            iv: p.IV,
            updatedAt: p.UpdatedAt
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a password
exports.deletePassword = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    try {
        const [result] = await pool.query("DELETE FROM Passwords WHERE PasswordID=? AND UserID=?", [id, userId]);
        if (result.affectedRows === 0) return res.status(404).json({ error: "Password not found" });
        res.json({ message: "Password deleted" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
