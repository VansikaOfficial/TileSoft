const pool = require('../config/database');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create product
exports.createProduct = async (req, res) => {
  try {
    const {
      product_name, hsn_code, rate, unit,
      image_url = null,
      category = 'Floor Tiles',
      color = 'Beige',
      size = '600x600mm',
      stock_quantity = 0,
      reorder_level = 50
    } = req.body;

    if (!product_name || !hsn_code || !rate || !unit) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const result = await pool.query(
      `INSERT INTO products 
        (product_name, hsn_code, rate, unit, image_url, category, color, size, stock_quantity, reorder_level) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [product_name, hsn_code, rate, unit, image_url, category, color, size, stock_quantity, reorder_level]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      product_name, hsn_code, rate, unit,
      image_url = null,
      category = 'Floor Tiles',
      color = 'Beige',
      size = '600x600mm',
      stock_quantity = 0,
      reorder_level = 50
    } = req.body;

    const result = await pool.query(
      `UPDATE products SET 
        product_name = $1,
        hsn_code = $2,
        rate = $3,
        unit = $4,
        image_url = $5,
        category = $6,
        color = $7,
        size = $8,
        stock_quantity = $9,
        reorder_level = $10
       WHERE id = $11 
       RETURNING *`,
      [product_name, hsn_code, rate, unit, image_url, category, color, size, stock_quantity, reorder_level, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if used in invoices first
    const used = await pool.query(
      'SELECT id FROM invoice_items WHERE product_id = $1 LIMIT 1',
      [id]
    );
    if (used.rows.length > 0) {
      return res.status(400).json({ message: 'Cannot delete — product is used in invoices' });
    }
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};