const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Login page
router.get('/login', (req, res) => {
  res.render('auth/login', { error: null });
});

// Login process
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  req.db.getDb().get(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, user) => {
      if (err) {
        return res.render('auth/login', { error: 'Database error' });
      }
      
      if (!user) {
        return res.render('auth/login', { error: 'Invalid credentials' });
      }
      
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.render('auth/login', { error: 'Invalid credentials' });
      }
      
      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.cookie('token', token, { httpOnly: true });
      res.redirect('/dashboard');
    }
  );
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/auth/login');
});

module.exports = router;