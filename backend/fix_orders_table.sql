-- Fix orders table: rename merchant_address to artisan_address
ALTER TABLE orders
RENAME COLUMN merchant_address TO artisan_address;

-- Verify the change
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'orders';
