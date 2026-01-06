const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { addPassword, getPasswords, deletePassword } = require('../controllers/passwordController');

router.post('/add', authenticateToken, addPassword);
router.get('/all', authenticateToken, getPasswords);
router.delete('/:id', authenticateToken, deletePassword);

module.exports = router;
