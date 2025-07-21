const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// List tasks
router.get('/', auth, (req, res) => {
  const db = req.db.getDb();
  
  db.all(
    `SELECT t.*, p.name as property_name, u.name as assigned_name 
     FROM tasks t 
     LEFT JOIN properties p ON t.property_id = p.id 
     LEFT JOIN users u ON t.assigned_to = u.id 
     ORDER BY t.due_date ASC`,
    (err, tasks) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error loading tasks');
      }
      
      res.render('tasks/index', {
        user: req.user,
        tasks
      });
    }
  );
});

// Create task
router.post('/', auth, (req, res) => {
  const { property_id, booking_id, title, description, type, due_date } = req.body;
  const db = req.db.getDb();
  
  db.run(
    `INSERT INTO tasks (property_id, booking_id, title, description, type, assigned_to, due_date) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [property_id, booking_id, title, description, type, req.user.userId, due_date],
    function(err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error creating task' });
      }
      
      res.json({ success: true, taskId: this.lastID });
    }
  );
});

// Update task status
router.post('/:id/status', auth, (req, res) => {
  const { status } = req.body;
  const taskId = req.params.id;
  const db = req.db.getDb();
  
  db.run(
    "UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, taskId],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error updating task' });
      }
      
      res.json({ success: true });
    }
  );
});

module.exports = router;