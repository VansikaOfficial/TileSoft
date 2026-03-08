const pool = require('../config/database');

// Get all customers
exports.getCustomers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM customers ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get customer by ID
exports.getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create customer
exports.createCustomer = async (req, res) => {
  try {
    const { company_name, contact_person, email, phone, address, gst_number } = req.body;

    if (!company_name || !contact_person || !phone) {
      return res.status(400).json({ message: 'Company name, contact person, and phone are required' });
    }

    const result = await pool.query(
      'INSERT INTO customers (company_name, contact_person, email, phone, address, gst_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [company_name, contact_person, email, phone, address, gst_number]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update customer
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, contact_person, email, phone, address, gst_number } = req.body;

    const result = await pool.query(
      'UPDATE customers SET company_name = $1, contact_person = $2, email = $3, phone = $4, address = $5, gst_number = $6 WHERE id = $7 RETURNING *',
      [company_name, contact_person, email, phone, address, gst_number, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete customer
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM customers WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
