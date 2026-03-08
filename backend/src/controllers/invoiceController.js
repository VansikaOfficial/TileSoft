const pool = require('../config/database');

// Get all invoices
exports.getInvoices = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        i.*,
        (SELECT company_name FROM customers WHERE id = i.customer_id) as customer_name
      FROM invoices i
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get invoice by ID with items
exports.getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get invoice
    const invoiceResult = await pool.query(`
      SELECT 
        i.*,
        c.company_name,
        c.contact_person,
        c.email,
        c.phone,
        c.address,
        c.gst_number
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = $1
    `, [id]);

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Get invoice items
    const itemsResult = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id',
      [id]
    );

    const invoice = {
      ...invoiceResult.rows[0],
      items: itemsResult.rows
    };

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create invoice
exports.createInvoice = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { customer_id, invoice_date, due_date, items, notes } = req.body;

    if (!invoice_date || !items || items.length === 0) {
  return res.status(400).json({ message: 'Missing required fields' });
}
    await client.query('BEGIN');

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += parseFloat(item.quantity) * parseFloat(item.rate);
    }

    // Calculate GST (28% total: 14% CGST + 14% SGST)
    const gstAmount = subtotal * 0.28;
    const totalAmount = subtotal + gstAmount;

    // Generate invoice number
    const invoiceNumberResult = await client.query(
      'SELECT invoice_number FROM invoices ORDER BY id DESC LIMIT 1'
    );
    
    let newInvoiceNumber = 'INV-0001';
    if (invoiceNumberResult.rows.length > 0) {
      const lastNumber = parseInt(invoiceNumberResult.rows[0].invoice_number.split('-')[1]);
      newInvoiceNumber = `INV-${String(lastNumber + 1).padStart(4, '0')}`;
    }

    // Insert invoice
    const invoiceResult = await client.query(
      'INSERT INTO invoices (invoice_number, customer_id, invoice_date, due_date, subtotal, total_amount, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [newInvoiceNumber, customer_id, invoice_date, due_date, subtotal, totalAmount, notes, 'pending']
    );

    const invoice = invoiceResult.rows[0];

    // Insert invoice items
    for (const item of items) {
      // Get product name
      const productResult = await client.query(
        'SELECT product_name FROM products WHERE id = $1',
        [item.product_id]
      );
      
      const productName = productResult.rows.length > 0 
        ? productResult.rows[0].product_name 
        : 'Unknown Product';

      const itemAmount = parseFloat(item.quantity) * parseFloat(item.rate);

      await client.query(
        'INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, rate, amount, unit) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [invoice.id, item.product_id, productName, item.quantity, item.rate, itemAmount, item.unit || 'pcs']
      );
    }

    await client.query('COMMIT');

    // Get complete invoice with items
    const completeInvoice = await exports.getInvoiceById({ params: { id: invoice.id } }, res);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  } finally {
    client.release();
  }
};

// Update invoice
exports.updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const result = await pool.query(
      'UPDATE invoices SET status = $1, notes = $2 WHERE id = $3 RETURNING *',
      [status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete invoice
exports.deleteInvoice = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    // Delete invoice items first
    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

    // Delete invoice
    const result = await client.query(
      'DELETE FROM invoices WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Invoice not found' });
    }

    await client.query('COMMIT');
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete invoice error:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
};

// Update invoice status
exports.updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_date, payment_method } = req.body;

    const result = await pool.query(
      'UPDATE invoices SET status = $1, payment_date = $2, payment_method = $3 WHERE id = $4 RETURNING *',
      [status, payment_date, payment_method, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update invoice status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
