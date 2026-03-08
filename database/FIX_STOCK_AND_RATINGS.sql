-- ============================================================
-- TILESOFT — Fix Low Stock, Out of Stock & Supplier Ratings
-- Run in pgAdmin → Query Tool → F5
-- ============================================================

-- ── 1. SET SOME PRODUCTS TO LOW STOCK (stock <= reorder_level) ──
-- Sets 5 products to low stock quantities
UPDATE products SET stock_quantity = 8,  reorder_level = 10 WHERE id = (SELECT id FROM products ORDER BY id LIMIT 1 OFFSET 0);
UPDATE products SET stock_quantity = 5,  reorder_level = 10 WHERE id = (SELECT id FROM products ORDER BY id LIMIT 1 OFFSET 2);
UPDATE products SET stock_quantity = 3,  reorder_level = 10 WHERE id = (SELECT id FROM products ORDER BY id LIMIT 1 OFFSET 5);
UPDATE products SET stock_quantity = 7,  reorder_level = 10 WHERE id = (SELECT id FROM products ORDER BY id LIMIT 1 OFFSET 8);
UPDATE products SET stock_quantity = 9,  reorder_level = 10 WHERE id = (SELECT id FROM products ORDER BY id LIMIT 1 OFFSET 12);

-- ── 2. SET SOME PRODUCTS TO OUT OF STOCK ──
-- Sets 3 products to 0 stock
UPDATE products SET stock_quantity = 0, reorder_level = 10 WHERE id = (SELECT id FROM products ORDER BY id LIMIT 1 OFFSET 15);
UPDATE products SET stock_quantity = 0, reorder_level = 10 WHERE id = (SELECT id FROM products ORDER BY id LIMIT 1 OFFSET 20);
UPDATE products SET stock_quantity = 0, reorder_level = 10 WHERE id = (SELECT id FROM products ORDER BY id LIMIT 1 OFFSET 25);

-- ── 3. FIX SUPPLIER RATINGS — ensure some are 5 stars ──
-- Sets top 3 suppliers to 5 star rating
UPDATE suppliers SET rating = 5 WHERE id = (SELECT id FROM suppliers ORDER BY id LIMIT 1 OFFSET 0);
UPDATE suppliers SET rating = 5 WHERE id = (SELECT id FROM suppliers ORDER BY id LIMIT 1 OFFSET 1);
UPDATE suppliers SET rating = 5 WHERE id = (SELECT id FROM suppliers ORDER BY id LIMIT 1 OFFSET 2);
UPDATE suppliers SET rating = 4 WHERE id = (SELECT id FROM suppliers ORDER BY id LIMIT 1 OFFSET 3);
UPDATE suppliers SET rating = 3 WHERE id = (SELECT id FROM suppliers ORDER BY id LIMIT 1 OFFSET 4);

-- ── VERIFY ──
SELECT 'Low Stock' as check_type, COUNT(*) as count FROM products WHERE stock_quantity > 0 AND stock_quantity <= reorder_level
UNION ALL
SELECT 'Out of Stock', COUNT(*) FROM products WHERE stock_quantity = 0
UNION ALL
SELECT 'Top Rated Suppliers (5★)', COUNT(*) FROM suppliers WHERE rating::numeric >= 4.5;
