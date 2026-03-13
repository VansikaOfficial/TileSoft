const pool = require('../config/database');

// Get dashboard statistics
exports.getStats = async (req, res) => {
  try {
    // Get total products
    const productsResult = await pool.query('SELECT COUNT(*) FROM products');
    const totalProducts = parseInt(productsResult.rows[0].count);

    // Get total customers
    const customersResult = await pool.query('SELECT COUNT(*) FROM customers');
    const totalCustomers = parseInt(customersResult.rows[0].count);

    // Get total invoices
    const invoicesResult = await pool.query('SELECT COUNT(*) FROM invoices');
    const totalInvoices = parseInt(invoicesResult.rows[0].count);

    // Get total revenue (sum of all paid invoices)
    const revenueResult = await pool.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices WHERE status = 'paid'"
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total);

    // Get pending invoices
    const pendingResult = await pool.query(
      "SELECT COUNT(*) FROM invoices WHERE status = 'pending'"
    );
    const pendingInvoices = parseInt(pendingResult.rows[0].count);

    // Get total employees
    const employeesResult = await pool.query('SELECT COUNT(*) FROM users');
    const totalEmployees = parseInt(employeesResult.rows[0].count);

    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const attendanceResult = await pool.query(
      'SELECT COUNT(*) FROM attendance WHERE date = $1',
      [today]
    );
    const todayAttendance = parseInt(attendanceResult.rows[0].count);

    // Get recent invoices
    const recentInvoicesResult = await pool.query(`
      SELECT 
        i.*,
        c.company_name as customer_name
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      ORDER BY i.created_at DESC
      LIMIT 5
    `);
   // Monthly revenue for last 6 months
const monthlyResult = await pool.query(`
  SELECT 
    TO_CHAR(invoice_date, 'Mon') as month,
    COALESCE(SUM(total_amount),0) as revenue
  FROM invoices 
  WHERE status = 'paid' 
    AND invoice_date >= NOW() - INTERVAL '6 months'
  GROUP BY TO_CHAR(invoice_date, 'Mon'), DATE_TRUNC('month', invoice_date)
  ORDER BY DATE_TRUNC('month', invoice_date)
`);

// Top selling products from invoice items
const topProductsResult = await pool.query(`
  SELECT 
    COALESCE(p.product_name, ii.product_name, 'Unknown') as name,
    COALESCE(SUM(ii.quantity), 0)::float as sales
  FROM invoice_items ii
  LEFT JOIN products p ON p.id = ii.product_id
  LEFT JOIN invoices i ON i.id = ii.invoice_id
  WHERE i.status IN ('paid', 'partial')
  GROUP BY COALESCE(p.product_name, ii.product_name, 'Unknown')
  ORDER BY sales DESC
  LIMIT 5
`);

res.json({
  totalProducts,
  totalCustomers,
  totalInvoices,
  totalRevenue,
  pendingInvoices,
  totalEmployees,
  todayAttendance,
  recentInvoices: recentInvoicesResult.rows,
  monthlyTrend: monthlyResult.rows,
  topProducts: topProductsResult.rows,
});

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get analytics separately (called by dashboard frontend)
exports.getAnalytics = async (req, res) => {
  try {
    const monthlyResult = await pool.query(`
      SELECT 
        TO_CHAR(invoice_date, 'Mon') as month,
        COALESCE(SUM(total_amount), 0)::float as revenue
      FROM invoices
      WHERE status = 'paid'
        AND invoice_date >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(invoice_date, 'Mon'), DATE_TRUNC('month', invoice_date)
      ORDER BY DATE_TRUNC('month', invoice_date)
    `);

    const topProductsResult = await pool.query(`
      SELECT 
        COALESCE(p.product_name, ii.product_name, 'Unknown') as name,
        COALESCE(SUM(ii.quantity), 0)::float as sales
      FROM invoice_items ii
      LEFT JOIN products p ON p.id = ii.product_id
      LEFT JOIN invoices i ON i.id = ii.invoice_id
      WHERE i.status IN ('paid', 'partial')
      GROUP BY COALESCE(p.product_name, ii.product_name, 'Unknown')
      ORDER BY sales DESC
      LIMIT 5
    `);

    res.json({
      monthlyTrend: monthlyResult.rows,
      topProducts: topProductsResult.rows,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};