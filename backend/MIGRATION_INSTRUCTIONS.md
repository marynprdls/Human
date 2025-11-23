# Database Migration Instructions

## Problem
The code expects `artisan_address` column but the database has `merchant_address`, causing QR generation to fail.

## Solution
Run the SQL migration script in Supabase SQL Editor.

## Steps

### 1. Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New query**

### 2. Copy and paste this SQL

```sql
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
```

### 3. Click "Run" or press `Ctrl+Enter`

### 4. Verify the results
You should see:
- Notices about the column rename
- A table showing all columns of the `orders` table
- Confirm that `artisan_address` column exists

### 5. Check existing orders
Run this query to see if there are any existing orders:

```sql
SELECT id, artisan_address, amount_xlm, status, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;
```

### 6. Restart backend server
After the migration, restart your backend:

```bash
cd backend
npm run dev
```

### 7. Test QR generation
1. Open the artisan dashboard
2. Generate a QR code
3. Check the console logs for:
   - `✅ Order inserted to DB successfully`
   - The order_id in the response

### 8. Verify in database
Go back to Supabase SQL Editor and run:

```sql
SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
```

You should see the newly created order.

## Common Issues

### Issue: "column merchant_address does not exist"
✅ Good! This means the migration already ran successfully.

### Issue: "relation 'products' does not exist"
⚠️  The products table doesn't exist yet. Remove the REFERENCES constraint:

```sql
ALTER TABLE orders ADD COLUMN product_id UUID;
```

### Issue: QR still not appearing
Check backend logs when clicking "Generar QR":
1. Look for `🚀 POST /api/orders/create - Request received`
2. Look for `💾 Inserting order to Supabase`
3. If you see `[F] DB error:`, that's the actual error

## After Migration

The backend will now correctly insert orders into the database with:
- `artisan_address` column (renamed from merchant_address)
- All QR generations will be logged
- Payment verification will work
