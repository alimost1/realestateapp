const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// List bookings
router.get('/', auth, (req, res) => {
  const db = req.db.getDb();
  
  db.all(
    `SELECT b.*, p.name as property_name 
     FROM bookings b 
     JOIN properties p ON b.property_id = p.id 
     ORDER BY b.check_in DESC`,
    (err, bookings) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error loading bookings');
      }
      
      res.render('bookings/index', {
        user: req.user,
        bookings
      });
    }
  );
});

// Show booking details
router.get('/:id', auth, (req, res) => {
  const db = req.db.getDb();
  const bookingId = req.params.id;
  
  db.get(
    `SELECT b.*, p.name as property_name, p.address as property_address 
     FROM bookings b 
     JOIN properties p ON b.property_id = p.id 
     WHERE b.id = ?`,
    [bookingId],
    (err, booking) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error loading booking');
      }
      
      if (!booking) {
        return res.status(404).send('Booking not found');
      }
      
      // Get messages for this booking
      db.all(
        "SELECT * FROM messages WHERE booking_id = ? ORDER BY created_at DESC",
        [bookingId],
        (err, messages) => {
          if (err) {
            console.error(err);
            messages = [];
          }
          
          // Get tasks for this booking
          db.all(
            "SELECT * FROM tasks WHERE booking_id = ? ORDER BY due_date ASC",
            [bookingId],
            (err, tasks) => {
              if (err) {
                console.error(err);
                tasks = [];
              }
              
              res.render('bookings/show', {
                user: req.user,
                booking,
                messages,
                tasks
              });
            }
          );
        }
      );
    }
  );
});

// Update booking status
router.post('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const bookingId = req.params.id;
  const db = req.db.getDb();
  
  db.run(
    "UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, bookingId],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error updating booking' });
      }
      
      res.json({ success: true });
    }
  );
});

module.exports = router;