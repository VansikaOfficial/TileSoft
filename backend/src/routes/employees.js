const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');

router.use(authMiddleware);

// GET all employees
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT e.*, 
        u.name as user_name, 
        u.email, 
        u.role
      FROM employees e
      LEFT JOIN users u ON u.id = SUBSTRING(e.employee_code, 4)::integer
      ORDER BY e.created_at DESC
    `);
    res.json({ employees: result.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// GET one employee
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM employees WHERE id = $1::uuid', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create employee
router.post('/', async (req, res) => {
  const { employee_code, designation, salary, date_of_joining, department_id, address, status } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO employees (employee_code, designation, salary, date_of_joining, department_id, address, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [employee_code, designation, salary || 0, date_of_joining || new Date(), department_id || null, address || '', status || 'active']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update employee
router.put('/:id', async (req, res) => {
  const { designation, salary, address, status, department_id } = req.body;
  try {
    const result = await db.query(
      `UPDATE employees 
       SET designation = $1,
           salary = $2,
           address = $3,
           status = $4,
           department_id = $5,
           updated_at = NOW()
       WHERE id = $6::uuid
       RETURNING *`,
      [designation, salary || 0, address || '', status || 'active', department_id || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Employee not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update employee error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// DELETE (deactivate) employee
router.delete('/:id', async (req, res) => {
  try {
    await db.query('UPDATE employees SET status = $1, updated_at = NOW() WHERE id = $2::uuid', ['terminated', req.params.id]);
    res.json({ message: 'Employee deactivated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;