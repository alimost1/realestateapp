const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
  const db = req.db.getDb();
  
  // Get dashboard statistics
  const queries = [
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM properties", (err, row) => {
        if (err) reject(err);
        else resolve({ totalProperties: row.count });
      });
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM bookings WHERE status = 'confirmed'", (err, row) => {
        if (err) reject(err);
        else resolve({ activeBookings: row.count });
      });
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM messages WHERE status = 'unread'", (err, row) => {
        if (err) reject(err);
        else resolve({ unreadMessages: row.count });
      });
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'", (err, row) => {
        if (err) reject(err);
        else resolve({ pendingTasks: row.count });
      });
    }),
    new Promise((resolve, reject) => {
      db.get("SELECT SUM(total_amount) as revenue FROM bookings WHERE status IN ('confirmed', 'completed')", (err, row) => {
        if (err) reject(err);
        else resolve({ totalRevenue: row.revenue || 0 });
      });
    })
  ];
  
  Promise.all(queries)
    .then(results => {
      const stats = Object.assign({}, ...results);
      
      // Get recent bookings
      db.all(
        `SELECT b.*, p.name as property_name 
         FROM bookings b 
         JOIN properties p ON b.property_id = p.id 
         ORDER BY b.created_at DESC 
         LIMIT 5`,
        (err, recentBookings) => {
          if (err) {
            console.error(err);
            recentBookings = [];
          }
          
          // Get pending tasks
          db.all(
            `SELECT t.*, p.name as property_name 
             FROM tasks t 
             LEFT JOIN properties p ON t.property_id = p.id 
             WHERE t.status = 'pending' 
             ORDER BY t.due_date ASC 
             LIMIT 5`,
            (err, pendingTasks) => {
              if (err) {
                console.error(err);
                pendingTasks = [];
              }
              
              res.render('dashboard/index', {
                user: req.user,
                stats,
                recentBookings,
                pendingTasks
              });
            }
          );
        }
      );
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error loading dashboard');
    });
});

module.exports = router;