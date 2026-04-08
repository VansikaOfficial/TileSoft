process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; 
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
  
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'staff',
        phone VARCHAR(20),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        company_name VARCHAR(255),
        contact_person VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        gst_number VARCHAR(50),
        tier VARCHAR(50) DEFAULT 'new',
        total_orders INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        gst_number VARCHAR(50),
        rating DECIMAL(3,1) DEFAULT 4.0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        product_name VARCHAR(255),
        sku VARCHAR(100) UNIQUE,
        hsn_code VARCHAR(50),
        category VARCHAR(100),
        size VARCHAR(100),
        material VARCHAR(100),
        unit_price DECIMAL(10,2),
        cost_price DECIMAL(10,2),
        rate DECIMAL(10,2),
        unit VARCHAR(50),
        stock_quantity INTEGER DEFAULT 0,
        reorder_level INTEGER DEFAULT 10,
        pei_rating INTEGER,
        water_absorption DECIMAL(5,2),
        slip_resistance_r INTEGER,
        mohs_hardness DECIMAL(4,1),
        description TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        employee_code VARCHAR(50) UNIQUE,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20),
        department VARCHAR(100),
        designation VARCHAR(100),
        role VARCHAR(100),
        salary DECIMAL(10,2),
        join_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number VARCHAR(50) UNIQUE,
        customer_id INTEGER,
        customer_name VARCHAR(255),
        invoice_date DATE,
        due_date DATE,
        subtotal DECIMAL(10,2),
        cgst DECIMAL(10,2) DEFAULT 0,
        sgst DECIMAL(10,2) DEFAULT 0,
        tax_amount DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        payment_date DATE,
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER,
        product_id INTEGER,
        product_name VARCHAR(255),
        quantity DECIMAL(10,2),
        rate DECIMAL(10,2),
        amount DECIMAL(10,2),
        unit VARCHAR(50),
        price DECIMAL(10,2),
        total DECIMAL(10,2)
      );
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        check_in TIME,
        check_out TIME,
        status VARCHAR(50) DEFAULT 'present',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(employee_id, date)
      );
      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        quotation_number VARCHAR(50) UNIQUE,
        customer_id INTEGER,
        customer_name VARCHAR(255),
        valid_until DATE,
        subtotal DECIMAL(10,2),
        total_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id SERIAL PRIMARY KEY,
        po_number VARCHAR(50) UNIQUE,
        supplier_id INTEGER,
        total_amount DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS payroll (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER,
        month INTEGER,
        year INTEGER,
        basic_salary DECIMAL(10,2),
        allowances DECIMAL(10,2) DEFAULT 0,
        deductions DECIMAL(10,2) DEFAULT 0,
        net_salary DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── ALWAYS ensure admin exists with correct password ──
    const adminPassword = 'admin123';
    const hash = await bcrypt.hash(adminPassword, 10);
    await pool.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ('Admin User', 'admin@tilesoft.com', $1, 'admin')
      ON CONFLICT (email) DO UPDATE SET password = $1, role = 'admin'
    `, [hash]);

    console.log('✅ Database initialized successfully');
    console.log('✅ Admin user ready: admin@tilesoft.com / admin123');
  } catch (err) {
    console.error('❌ Database init error:', err.message);
  }
}

initDB();

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;














