const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

exports.createNote = async (req, res) => {
  const { encryptedContent, iv, expiryMinutes, viewOnce } = req.body;
  const userId = req.user.userId;

  if (!encryptedContent || !iv || !expiryMinutes) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const noteId = uuidv4();
  const expiryDate = new Date(Date.now() + expiryMinutes * 60000);
  try {
    // If attemptLimit is provided, use it (map to MaxViews column). Default to 1 if not provided or 0.
    // If viewOnce is true, we can effectively set MaxViews to 1 (or handle via ViewOnce logic).
    const maxViews = req.body.attemptLimit || (viewOnce ? 1 : 100);

    await pool.query(
      "INSERT INTO Notes (NoteID, UserID, EncryptedContent, IV, CreatedAt, ExpiryTime, ViewOnce, MaxViews, ViewCount) VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 0)",
      [noteId, userId, encryptedContent, iv, expiryDate, viewOnce ? 1 : 0, maxViews]
    );
    res.status(201).json({ noteId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNote = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query("SELECT * FROM Notes WHERE NoteID=? AND IsDeleted=FALSE", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Note not found or deleted" });
    const note = rows[0];
    if (new Date() > note.ExpiryTime) return res.status(410).json({ error: "Note expired" });

    // UPDATE: Increment view count and check limits
    // We increment the view count in the database
    await pool.query("UPDATE Notes SET ViewCount = ViewCount + 1 WHERE NoteID=?", [id]);

    // Check if we need to self-destruct (ViewOnce or MaxViews reached)
    // Note: We use the *current* fetched note data to decide, but we must account for the increment we just did.
    // If ViewOnce is true, this is the one and only view.
    // If MaxViews is set, check if current ViewCount + 1 >= MaxViews.
    const currentViewCount = note.ViewCount + 1;
    // Fix: Use loose equality or truthiness check for ViewOnce since MySQL driver return types can vary
    const shouldDelete = (!!note.ViewOnce) || (note.MaxViews > 0 && currentViewCount >= note.MaxViews);

    console.log(`[DEBUG] NoteID: ${id}, ViewOnce: ${note.ViewOnce}, MaxViews: ${note.MaxViews}, CurrentViewCount: ${currentViewCount}, ShouldDelete: ${shouldDelete}`);

    if (shouldDelete) {
      // Mark as deleted for future requests
      await pool.query("UPDATE Notes SET IsDeleted=TRUE WHERE NoteID=?", [id]);
      console.log(`[DEBUG] Mark deleted NoteID: ${id}`);
    }

    res.json({
      encryptedContent: note.EncryptedContent,
      iv: note.IV,
      viewOnce: note.ViewOnce,
      expiryTime: note.ExpiryTime,
      maxViews: note.MaxViews,
      viewCount: currentViewCount // Return the count *after* this view
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteNote = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("UPDATE Notes SET IsDeleted=TRUE WHERE NoteID=?", [id]);
    res.json({ message: "Note deleted (self-destructed)" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
