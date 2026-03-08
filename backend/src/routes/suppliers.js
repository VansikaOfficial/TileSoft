const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const db = require('../config/database');

router.use(authMiddleware);

// GET all suppliers
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM suppliers ORDER BY created_at DESC');
    res.json({ suppliers: result.rows });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create supplier
router.post('/', async (req, res) => {
  const { name, contact_person, email, phone, address, city, state, gst_number, payment_terms } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO suppliers (name, contact_person, email, phone, address, city, state, gst_number, payment_terms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [name, contact_person, email, phone, address, city, state, gst_number, payment_terms]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update supplier
router.put('/:id', async (req, res) => {
  const { name, contact_person, email, phone, address, city, state, gst_number, payment_terms } = req.body;
  try {
    const result = await db.query(
      `UPDATE suppliers SET name=$1, contact_person=$2, email=$3, phone=$4, address=$5, city=$6, state=$7, gst_number=$8, payment_terms=$9 WHERE id=$10 RETURNING *`,
      [name, contact_person, email, phone, address, city, state, gst_number, payment_terms, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
