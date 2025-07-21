const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// List messages
router.get('/', auth, (req, res) => {
  const db = req.db.getDb();
  
  db.all(
    `SELECT m.*, b.guest_name, p.name as property_name 
     FROM messages m 
     LEFT JOIN bookings b ON m.booking_id = b.id 
     LEFT JOIN properties p ON b.property_id = p.id 
     ORDER BY m.created_at DESC`,
    (err, messages) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error loading messages');
      }
      
      res.render('messages/index', {
        user: req.user,
        messages
      });
    }
  );
});

// Send message
router.post('/', auth, (req, res) => {
  const { booking_id, message, recipient_email } = req.body;
  const db = req.db.getDb();
  
  db.run(
    `INSERT INTO messages (booking_id, sender_name, sender_email, message, channel, status) 
     VALUES (?, ?, ?, ?, 'internal', 'sent')`,
    [booking_id, req.user.name || 'Staff', req.user.email, message],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error sending message' });
      }
      
      res.json({ success: true, messageId: this.lastID });
    }
  );
});

// Mark message as read
router.post('/:id/read', auth, (req, res) => {
  const messageId = req.params.id;
  const db = req.db.getDb();
  
  db.run(
    "UPDATE messages SET status = 'read' WHERE id = ?",
    [messageId],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error updating message' });
      }
      
      res.json({ success: true });
    }
  );
});

module.exports = router;