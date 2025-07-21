const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// List properties
router.get('/', auth, (req, res) => {
  const db = req.db.getDb();
  
  db.all(
    `SELECT p.*, u.name as owner_name 
     FROM properties p 
     LEFT JOIN users u ON p.owner_id = u.id 
     ORDER BY p.created_at DESC`,
    (err, properties) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error loading properties');
      }
      
      res.render('properties/index', {
        user: req.user,
        properties
      });
    }
  );
});

// Show property details
router.get('/:id', auth, (req, res) => {
  const db = req.db.getDb();
  const propertyId = req.params.id;
  
  db.get(
    `SELECT p.*, u.name as owner_name 
     FROM properties p 
     LEFT JOIN users u ON p.owner_id = u.id 
     WHERE p.id = ?`,
    [propertyId],
    (err, property) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Error loading property');
      }
      
      if (!property) {
        return res.status(404).send('Property not found');
      }
      
      // Get bookings for this property
      db.all(
        "SELECT * FROM bookings WHERE property_id = ? ORDER BY check_in DESC",
        [propertyId],
        (err, bookings) => {
          if (err) {
            console.error(err);
            bookings = [];
          }
          
          res.render('properties/show', {
            user: req.user,
            property,
            bookings
          });
        }
      );
    }
  );
});

// Create property form
router.get('/create', auth, (req, res) => {
  res.render('properties/create', {
    user: req.user,
    errors: null
  });
});

// Store new property
router.post('/', auth, (req, res) => {
  const { name, address, type, bedrooms, bathrooms, max_guests, price_per_night } = req.body;
  const db = req.db.getDb();
  
  db.run(
    `INSERT INTO properties (name, address, type, bedrooms, bathrooms, max_guests, price_per_night, owner_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, address, type, bedrooms, bathrooms, max_guests, price_per_night, req.user.userId],
    function(err) {
      if (err) {
        console.error(err);
        return res.render('properties/create', {
          user: req.user,
          errors: ['Error creating property']
        });
      }
      
      res.redirect('/properties');
    }
  );
});

module.exports = router;