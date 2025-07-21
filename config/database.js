const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  init() {
    const dbPath = path.join(__dirname, '..', 'database.sqlite');
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to SQLite database');
        this.createTables();
        this.seedData();
      }
    });
  }

  createTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'staff',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        type TEXT NOT NULL,
        bedrooms INTEGER DEFAULT 1,
        bathrooms INTEGER DEFAULT 1,
        max_guests INTEGER DEFAULT 2,
        price_per_night DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'available',
        owner_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        guest_phone TEXT,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        guests INTEGER DEFAULT 1,
        total_amount DECIMAL(10,2) NOT NULL,
        status TEXT DEFAULT 'pending',
        channel TEXT DEFAULT 'direct',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER,
        sender_name TEXT NOT NULL,
        sender_email TEXT NOT NULL,
        message TEXT NOT NULL,
        channel TEXT DEFAULT 'internal',
        status TEXT DEFAULT 'unread',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER,
        booking_id INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        assigned_to INTEGER,
        due_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id),
        FOREIGN KEY (booking_id) REFERENCES bookings(id),
        FOREIGN KEY (assigned_to) REFERENCES users(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        booking_id INTEGER NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        transaction_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
      )`
    ];

    tables.forEach(table => {
      this.db.run(table, (err) => {
        if (err) {
          console.error('Error creating table:', err);
        }
      });
    });
  }

  seedData() {
    // Check if data already exists
    this.db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
      if (err || row.count > 0) return;

      // Seed users
      const users = [
        ['Admin User', 'admin@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'],
        ['Property Manager', 'manager@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'staff'],
        ['John Owner', 'owner@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'owner']
      ];

      users.forEach(user => {
        this.db.run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", user);
      });

      // Seed properties
      const properties = [
        ['Luxury Downtown Apartment', '123 Main St, Downtown', 'apartment', 2, 2, 4, 150.00, 'available', 3],
        ['Cozy Beach House', '456 Ocean Ave, Beachfront', 'house', 3, 2, 6, 250.00, 'available', 3],
        ['Modern Studio Loft', '789 Art District, Creative Quarter', 'studio', 1, 1, 2, 85.00, 'available', 3]
      ];

      properties.forEach(property => {
        this.db.run("INSERT INTO properties (name, address, type, bedrooms, bathrooms, max_guests, price_per_night, status, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", property);
      });

      // Seed bookings
      const bookings = [
        [1, 'Alice Johnson', 'alice@example.com', '+1234567890', '2024-02-15', '2024-02-18', 2, 450.00, 'confirmed', 'airbnb'],
        [2, 'Bob Smith', 'bob@example.com', '+1234567891', '2024-02-20', '2024-02-25', 4, 1250.00, 'pending', 'booking.com'],
        [3, 'Carol Davis', 'carol@example.com', '+1234567892', '2024-02-10', '2024-02-12', 1, 170.00, 'completed', 'direct']
      ];

      bookings.forEach(booking => {
        this.db.run("INSERT INTO bookings (property_id, guest_name, guest_email, guest_phone, check_in, check_out, guests, total_amount, status, channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", booking);
      });

      // Seed tasks
      const tasks = [
        [1, 1, 'Pre-arrival cleaning', 'Deep clean apartment before guest arrival', 'cleaning', 'completed', 2, '2024-02-14 10:00:00'],
        [2, 2, 'Check-in preparation', 'Prepare welcome package and keys', 'checkin', 'pending', 2, '2024-02-20 14:00:00'],
        [3, 3, 'Post-checkout inspection', 'Inspect property after guest departure', 'checkout', 'completed', 2, '2024-02-12 12:00:00']
      ];

      tasks.forEach(task => {
        this.db.run("INSERT INTO tasks (property_id, booking_id, title, description, type, status, assigned_to, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", task);
      });

      console.log('Database seeded successfully');
    });
  }

  getDb() {
    return this.db;
  }
}

module.exports = Database;