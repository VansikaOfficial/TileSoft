-- ============================================
-- TILESOFT DUMMY DATA - Full Seed
-- ============================================

-- USERS (manager, employee, customer roles)
INSERT INTO users (name, email, password, role) VALUES
('Rajesh Sharma', 'manager@tilesoft.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager'),
('Priya Patel', 'employee@tilesoft.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'employee'),
('Srimadhu Kumar', 'customer@tilesoft.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer')
ON CONFLICT (email) DO NOTHING;

-- PRODUCTS
INSERT INTO products (name, sku, category, size, material, unit_price, cost_price, stock_quantity, reorder_level, pei_rating, water_absorption, slip_resistance_r, mohs_hardness, description) VALUES
('Marble White Premium', 'MW-001', 'Floor Tiles', '600x600mm', 'Marble', 85, 55, 450, 100, 4, 0.3, 11, 7.5, 'Premium white marble floor tile'),
('Anti-Slip Black', 'BT-101', 'Floor Tiles', '300x300mm', 'Ceramic', 48, 28, 750, 150, 3, 1.2, 13, 6.0, 'Anti-slip black ceramic tile'),
('Aqua Blue Mosaic', 'WT-002', 'Wall Tiles', '300x300mm', 'Glass', 32, 18, 1500, 200, 2, 0.5, 10, 5.5, 'Aqua blue glass mosaic for walls'),
('Aqua Marine', 'BT-002', 'Floor Tiles', '300x450mm', 'Ceramic', 38, 23, 920, 100, 3, 0.9, 11, 6.5, 'Aqua marine ceramic floor tile'),
('Rustic Brown Wood', 'WD-001', 'Floor Tiles', '200x1200mm', 'Vitrified', 120, 78, 320, 80, 5, 0.1, 11, 8.0, 'Wood look vitrified tile'),
('Pearl Grey', 'PG-001', 'Wall Tiles', '300x600mm', 'Ceramic', 42, 25, 680, 120, 3, 0.8, 10, 6.0, 'Pearl grey ceramic wall tile'),
('Onyx Black', 'OB-001', 'Floor Tiles', '600x1200mm', 'Vitrified', 145, 95, 280, 60, 5, 0.05, 11, 8.5, 'Premium onyx black large format tile'),
('Terracotta Orange', 'TC-001', 'Floor Tiles', '400x400mm', 'Terracotta', 28, 15, 850, 200, 2, 2.5, 9, 4.5, 'Traditional terracotta floor tile'),
('Ivory Gloss', 'IG-001', 'Wall Tiles', '250x375mm', 'Ceramic', 22, 12, 2200, 300, 2, 0.6, 9, 5.0, 'Glossy ivory ceramic wall tile'),
('Sandstone Beige', 'SB-001', 'Outdoor', '600x600mm', 'Natural Stone', 95, 62, 380, 80, 4, 1.8, 13, 7.0, 'Natural sandstone outdoor tile'),
('Midnight Blue', 'MB-001', 'Wall Tiles', '300x600mm', 'Ceramic', 55, 34, 560, 100, 3, 0.7, 10, 6.0, 'Deep midnight blue wall tile'),
('Forest Green', 'FG-001', 'Floor Tiles', '300x300mm', 'Ceramic', 35, 20, 720, 150, 3, 1.0, 12, 6.0, 'Forest green floor tile'),
('Arctic White', 'AW-001', 'Wall Tiles', '300x600mm', 'Ceramic', 30, 16, 1800, 250, 3, 0.5, 9, 5.5, 'Clean arctic white wall tile'),
('Copper Metallic', 'CM-001', 'Decorative', '100x100mm', 'Metal', 180, 120, 150, 50, 2, 0.0, 9, 9.0, 'Copper metallic decorative tile'),
('Slate Grey Natural', 'SG-001', 'Outdoor', '400x400mm', 'Slate', 75, 48, 440, 90, 4, 2.0, 13, 7.5, 'Natural slate grey outdoor tile')
ON CONFLICT (sku) DO NOTHING;

-- CUSTOMERS
INSERT INTO customers (name, email, phone, address, city, tier, total_orders) VALUES
('Arjun Mehta', 'arjun.mehta@gmail.com', '9876543210', '12 MG Road', 'Bangalore', 'vip', 15),
('Sunita Reddy', 'sunita.r@outlook.com', '9845612378', '45 Banjara Hills', 'Hyderabad', 'returning', 7),
('Kiran Construction', 'kiran.const@company.com', '9812345678', '78 Industrial Area', 'Chennai', 'vip', 28),
('Pradeep Nair', 'pradeep.n@gmail.com', '9732145678', '23 Panjim Road', 'Goa', 'new', 2),
('Lakshmi Builders', 'info@lakshmibuilders.com', '9654321987', '100 Builder Colony', 'Coimbatore', 'returning', 9),
('Ramesh Iyer', 'ramesh.iyer@yahoo.com', '9543219876', '67 Anna Nagar', 'Chennai', 'returning', 5),
('Deepa Shah', 'deepa.shah@gmail.com', '9432198765', '34 Satellite Road', 'Ahmedabad', 'new', 1),
('Vijay Constructions', 'vijay@vconstruct.in', '9321987654', '89 Ring Road', 'Pune', 'vip', 22),
('Anita Sharma', 'anita.s@gmail.com', '9219876543', '56 Civil Lines', 'Jaipur', 'returning', 6),
('MK Interiors', 'contact@mkinteriors.com', '9109876543', '12 Design District', 'Mumbai', 'vip', 35)
ON CONFLICT (email) DO NOTHING;

-- SUPPLIERS
INSERT INTO suppliers (name, email, phone, address, city, gst_number) VALUES
('Kajaria Ceramics Ltd', 'supply@kajaria.com', '1800123456', 'Kajaria House, NH-58', 'Ghaziabad', '09AAACK1234A1Z5'),
('Somany Tiles Pvt Ltd', 'orders@somany.in', '1800234567', 'Somany House, Sector 44', 'Gurugram', '06AABCS5678B2Z3'),
('Orient Bell Limited', 'procurement@orientbell.com', '1800345678', 'Orient House, Sohna Road', 'Gurugram', '06AAACO9012C3Z1'),
('Asian Granito India', 'sales@asiangranito.com', '1800456789', 'Asian House, GIDC', 'Ahmedabad', '24AAACA3456D4Z8'),
('RAK Ceramics India', 'india@rakceramics.com', '1800567890', 'RAK House, Bhiwadi', 'Alwar', '08AAACR7890E5Z6'),
('Nitco Tiles Ltd', 'supply@nitco.in', '1800678901', 'Nitco House, LBS Marg', 'Mumbai', '27AAACN2345F6Z4')
ON CONFLICT (email) DO NOTHING;

-- EMPLOYEES
INSERT INTO employees (name, employee_code, email, phone, department, designation, salary, join_date) VALUES
('Vansi Kumar', 'EMP001', 'vansi@tilesoft.com', '9876543001', 'HR', 'HR Manager', 45000, '2023-01-15'),
('Rajesh Sharma', 'EMP002', 'rajesh@tilesoft.com', '9876543002', 'Sales', 'Sales Manager', 55000, '2022-06-01'),
('Priya Patel', 'EMP003', 'priya@tilesoft.com', '9876543003', 'Operations', 'Operations Executive', 35000, '2023-03-10'),
('Amit Singh', 'EMP004', 'amit@tilesoft.com', '9876543004', 'Sales', 'Sales Executive', 30000, '2023-05-20'),
('Sneha Reddy', 'EMP005', 'sneha@tilesoft.com', '9876543005', 'Accounts', 'Accountant', 38000, '2022-09-01'),
('Vikram Malhotra', 'EMP006', 'vikram@tilesoft.com', '9876543006', 'Operations', 'Warehouse Manager', 42000, '2022-03-15'),
('Kavya Nair', 'EMP007', 'kavya@tilesoft.com', '9876543007', 'Sales', 'Sales Executive', 28000, '2023-07-01'),
('Arjun Desai', 'EMP008', 'arjun@tilesoft.com', '9876543008', 'IT', 'IT Support', 40000, '2023-02-01'),
('Meera Krishnan', 'EMP009', 'meera@tilesoft.com', '9876543009', 'Accounts', 'Finance Executive', 36000, '2023-08-15'),
('Suresh Pillai', 'EMP010', 'suresh@tilesoft.com', '9876543010', 'HR', 'HR Executive', 32000, '2023-10-01')
ON CONFLICT (employee_code) DO NOTHING;

-- INVOICES
INSERT INTO invoices (invoice_number, customer_id, subtotal, tax_amount, total_amount, payment_status, created_at)
SELECT 
  'INV-2026-' || LPAD(row_number() OVER ()::text, 4, '0'),
  c.id,
  v.subtotal,
  ROUND(v.subtotal * 0.28, 2),
  ROUND(v.subtotal * 1.28, 2),
  v.status,
  v.dt
FROM customers c
CROSS JOIN (VALUES
  (12500.00, 'paid', NOW() - INTERVAL '5 days'),
  (8750.00, 'paid', NOW() - INTERVAL '10 days'),
  (22000.00, 'pending', NOW() - INTERVAL '3 days'),
  (5500.00, 'paid', NOW() - INTERVAL '15 days'),
  (18000.00, 'overdue', NOW() - INTERVAL '35 days'),
  (9200.00, 'pending', NOW() - INTERVAL '2 days'),
  (31500.00, 'paid', NOW() - INTERVAL '20 days'),
  (6800.00, 'paid', NOW() - INTERVAL '8 days')
) AS v(subtotal, status, dt)
WHERE c.email = 'arjun.mehta@gmail.com'
LIMIT 8;

