-- Smart Billing System Database Schema

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table (Employees/Staff)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(50) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    gst_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    payment_date DATE,
    payment_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice Items table
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    product_name VARCHAR(255) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    rate DECIMAL(10, 2) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in TIME NOT NULL,
    check_out TIME,
    status VARCHAR(50) DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

-- Insert default admin user
-- Password: admin123 (hashed with bcrypt)
INSERT INTO users (name, email, password, role) VALUES 
('Admin User', 'admin@tilesoft.com', '$2a$10$YQkJKhGGZ0j6zQJ0xRJBF.VvTVGZZ3k.3Y4YzPZ0gR0vKG0KJ9YXO', 'admin');

-- Insert sample products with Unsplash images
INSERT INTO products (product_name, hsn_code, rate, unit, image_url) VALUES
('Vitrified Tiles 600x600mm', '690721', 450.00, 'Box', 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=400'),
('Ceramic Wall Tiles 300x450mm', '690722', 320.00, 'Box', 'https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=400'),
('Porcelain Floor Tiles 800x800mm', '690723', 680.00, 'Box', 'https://images.unsplash.com/photo-1615971677499-5467cbab01c0?w=400'),
('Granite Tiles 600x600mm', '680221', 550.00, 'Box', 'https://images.unsplash.com/photo-1615876234886-fd9a39fda97f?w=400'),
('Marble Tiles 600x600mm', '680222', 750.00, 'Box', 'https://images.unsplash.com/photo-1618221710640-c0eaaa2adb49?w=400');

-- Insert sample customers
INSERT INTO customers (company_name, contact_person, email, phone, address, gst_number) VALUES
('ABC Constructions', 'John Doe', 'john@abcconstruction.com', '9876543210', '123 MG Road, Bangalore', '29ABCDE1234F1Z5'),
('XYZ Developers', 'Jane Smith', 'jane@xyzdev.com', '9876543211', '456 Park Street, Mumbai', '27XYZAB5678G2Y6'),
('Prime Interiors', 'Robert Brown', 'robert@primeinteriors.com', '9876543212', '789 Lake View, Pune', '27PRIME9012H3X7');

-- Insert sample invoices
INSERT INTO invoices (invoice_number, customer_id, invoice_date, due_date, subtotal, total_amount, status, notes) VALUES
('INV-0001', 1, '2024-01-15', '2024-02-15', 4500.00, 5760.00, 'paid', 'First batch delivery'),
('INV-0002', 2, '2024-01-20', '2024-02-20', 3200.00, 4096.00, 'pending', 'Wall tiles for lobby'),
('INV-0003', 3, '2024-01-25', '2024-02-25', 6800.00, 8704.00, 'pending', 'Premium porcelain tiles');

-- Insert sample invoice items
INSERT INTO invoice_items (invoice_id, product_id, product_name, quantity, rate, amount, unit) VALUES
(1, 1, 'Vitrified Tiles 600x600mm', 10, 450.00, 4500.00, 'Box'),
(2, 2, 'Ceramic Wall Tiles 300x450mm', 10, 320.00, 3200.00, 'Box'),
(3, 3, 'Porcelain Floor Tiles 800x800mm', 10, 680.00, 6800.00, 'Box');

-- Insert sample employees
INSERT INTO users (name, email, password, role, phone, address) VALUES
('Sales Manager', 'sales@tilesoft.com', '$2a$10$YQkJKhGGZ0j6zQJ0xRJBF.VvTVGZZ3k.3Y4YzPZ0gR0vKG0KJ9YXO', 'manager', '9876543213', 'Bangalore'),
('Warehouse Staff', 'warehouse@tilesoft.com', '$2a$10$YQkJKhGGZ0j6zQJ0xRJBF.VvTVGZZ3k.3Y4YzPZ0gR0vKG0KJ9YXO', 'staff', '9876543214', 'Bangalore'),
('Delivery Driver', 'driver@tilesoft.com', '$2a$10$YQkJKhGGZ0j6zQJ0xRJBF.VvTVGZZ3k.3Y4YzPZ0gR0vKG0KJ9YXO', 'driver', '9876543215', 'Bangalore');

-- Insert sample attendance for today
INSERT INTO attendance (employee_id, date, check_in, check_out, status) VALUES
(1, CURRENT_DATE, '09:00:00', '18:00:00', 'present'),
(2, CURRENT_DATE, '09:15:00', '17:45:00', 'present'),
(3, CURRENT_DATE, '10:00:00', NULL, 'present');

-- Create indexes for better performance
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
