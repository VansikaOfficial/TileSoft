const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const customerRoutes = require('./routes/customers');
const invoiceRoutes = require('./routes/invoices');
const userRoutes = require('./routes/users');
const attendanceRoutes = require('./routes/attendance');
const dashboardRoutes = require('./routes/dashboard');
const employeeRoutes = require('./routes/employees');
const supplierRoutes = require('./routes/suppliers');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/suppliers', supplierRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Smart Billing System API is running' });
});

// ONE-TIME ADMIN SEED ROUTE
app.get('/seed-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const pool = require('./config/database');
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ('Admin User', 'admin@tilesoft.com', $1, 'admin')
       ON CONFLICT (email) DO UPDATE SET password = $1, role = 'admin'`,
      [hash]
    );
    res.json({ success: true, message: 'Admin created! Login with admin@tilesoft.com / admin123' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
