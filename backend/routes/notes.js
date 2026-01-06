const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { createNote, getNote, deleteNote } = require('../controllers/notesController');

router.post('/create', authenticateToken, createNote);
router.get('/:id', authenticateToken, getNote);
router.delete('/:id', authenticateToken, deleteNote);

module.exports = router;
