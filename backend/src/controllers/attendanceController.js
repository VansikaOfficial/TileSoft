const pool = require('../config/database');

// Get all attendance records
exports.getAttendance = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*,
        u.name as employee_name,
        u.role as employee_role
      FROM attendance a
      LEFT JOIN users u ON a.employee_id = u.id
      ORDER BY a.date DESC, a.check_in DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get attendance by ID
exports.getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT 
        a.*,
        u.name as employee_name,
        u.role as employee_role
      FROM attendance a
      LEFT JOIN users u ON a.employee_id = u.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create attendance record
exports.createAttendance = async (req, res) => {
  try {
    const { employee_id, date, check_in, check_out, status, notes } = req.body;

    if (!employee_id || !date) {
  return res.status(400).json({ message: 'Employee ID and date are required' });
}
const checkInTime = status === 'absent' || status === 'leave' ? null : (check_in || '09:00');
    // Check if attendance already exists for this employee on this date
    const existingAttendance = await pool.query(
      'SELECT * FROM attendance WHERE employee_id = $1 AND date = $2',
      [employee_id, date]
    );

    if (existingAttendance.rows.length > 0) {
      return res.status(400).json({ message: 'Attendance already recorded for this employee on this date' });
    }

    const result = await pool.query(
      'INSERT INTO attendance (employee_id, date, check_in, check_out, status, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [employee_id, date, check_in, check_out, status || 'present', notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update attendance record
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, check_in, check_out, status, notes } = req.body;

    const result = await pool.query(
      'UPDATE attendance SET date = $1, check_in = $2, check_out = $3, status = $4, notes = $5 WHERE id = $6 RETURNING *',
      [date, check_in, check_out, status, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete attendance record
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM attendance WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (error) {
    console.error('Delete attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get today's attendance
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT 
        a.*,
        u.name as employee_name,
        u.role as employee_role
      FROM attendance a
      LEFT JOIN users u ON a.employee_id = u.id
      WHERE a.date = $1
      ORDER BY a.check_in DESC
    `, [today]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Get attendance summary grouped by employee
exports.getAttendanceSummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.employee_id,
        u.email,
        u.role,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent,
        COUNT(CASE WHEN a.status = 'leave' THEN 1 END) as leave
      FROM attendance a
      LEFT JOIN users u ON a.employee_id = u.id
      GROUP BY a.employee_id, u.email, u.role
      ORDER BY a.employee_id
    `);

    const nameMap = {
      'admin@tilesoft.com': { name: 'Admin User', code: 'EMP001', dept: 'Management' },
      'sales@tilesoft.com': { name: 'Rajesh Sharma', code: 'EMP002', dept: 'Sales' },
      'warehouse@tilesoft.com': { name: 'Priya Patel', code: 'EMP003', dept: 'Operations' },
      'driver@tilesoft.com': { name: 'Amit Singh', code: 'EMP004', dept: 'Logistics' },
      'manager@tilesoft.com': { name: 'Sneha Reddy', code: 'EMP005', dept: 'Management' },
      'employee@tilesoft.com': { name: 'Kavya Nair', code: 'EMP006', dept: 'Sales' },
    };

    const summary = result.rows.map(row => ({
      ...row,
      name: nameMap[row.email]?.name || row.email,
      employee_code: nameMap[row.email]?.code || `EMP00${row.employee_id}`,
      department: nameMap[row.email]?.dept || row.role,
    }));

    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};