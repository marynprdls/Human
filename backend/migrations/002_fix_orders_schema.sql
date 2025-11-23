-- Migration 002: Fix orders table schema
-- 1. Rename merchant_address to artisan_address (if not already done)
DO $$
BEGIN
    IF EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name='orders' AND column_name='merchant_address'
    ) THEN
        ALTER TABLE orders RENAME COLUMN merchant_address TO artisan_address;
        RAISE NOTICE 'Renamed merchant_address to artisan_address';
    ELSE
        RAISE NOTICE 'Column artisan_address already exists';
    END IF;
END $$;

-- 2. Add product_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name='orders' AND column_name='product_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN product_id UUID REFERENCES products(id);
        RAISE NOTICE 'Added product_id column';
    ELSE
        RAISE NOTICE 'Column product_id already exists';
    END IF;
END $$;

-- 3. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_artisan ON orders(artisan_address);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_tx_hash ON orders(tx_hash);

-- 4. Verify the schema
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
