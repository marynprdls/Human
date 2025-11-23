# Debugging Guide: QR Generation & Payment Verification Issues

## Issue Summary

**Problem 1**: QR generation not appearing in database
**Problem 2**: On-chain verified payments not activating

## Root Cause Analysis

### Database Schema Mismatch
The backend code expects column `artisan_address` but the database has `merchant_address`.

**Evidence:**
- User provided schema shows: `merchant_address VARCHAR(56) NOT NULL`
- Backend code uses: `artisan_address` in INSERT queries
- This mismatch causes all QR generation INSERT operations to fail silently

**Impact:**
- Orders cannot be created in database
- QR codes are generated but not linked to any order
- Payment verification fails because no order exists to verify against

## Solution Steps

### Step 1: Run Database Migration

Open Supabase SQL Editor and run the migration script:

**Location**: `backend/migrations/002_fix_orders_schema.sql`

OR copy-paste this SQL directly:

```sql
-- 1. Rename merchant_address to artisan_address
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

-- 2. Add product_id column if needed
DO $$
BEGIN
    IF NOT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name='orders' AND column_name='product_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN product_id UUID;
        RAISE NOTICE 'Added product_id column';
    ELSE
        RAISE NOTICE 'Column product_id already exists';
    END IF;
END $$;

-- 3. Create performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_artisan ON orders(artisan_address);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_tx_hash ON orders(tx_hash);

-- 4. Verify schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;
```

### Step 2: Verify Migration Success

Run this query to confirm the column exists:

```sql
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'orders' AND column_name = 'artisan_address';
```

Expected result: One row showing `artisan_address`

### Step 3: Test QR Generation

1. Restart backend server (TypeScript will recompile with enhanced logging)
2. Open artisan dashboard in browser
3. Click "Generar QR de pago"
4. Enter amount and click "Generar QR"

**Backend logs to watch for:**

✅ **Success path:**
```
🚀 POST /api/orders/create - Request received
📦 Creating order: { artisan_address: 'GC...', amount_xlm: 10, currency: 'XLM' }
💾 Inserting order to Supabase: { id: '...', artisan_address: 'GC...', ... }
[ok] Order inserted to DB successfully
📱 QR generated, length: 15234
📤 Sending response with order_id: abc123...
```

❌ **Failure path (before migration):**
```
🚀 POST /api/orders/create - Request received
📦 Creating order: { artisan_address: 'GC...', amount_xlm: 10, currency: 'XLM' }
💾 Inserting order to Supabase: { id: '...', artisan_address: 'GC...', ... }
[F] DB error: { message: 'column "artisan_address" does not exist', code: '42703' }
[F] DB error details: { ... full error object ... }
[F] Order data that failed: { ... attempted insert data ... }
```

### Step 4: Verify in Database

After successful QR generation, run:

```sql
SELECT
    id,
    artisan_address,
    amount_xlm,
    currency,
    status,
    memo,
    created_at,
    expires_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;
```

You should see your newly created orders.

### Step 5: Test Payment Verification

1. Use client dashboard to scan QR
2. Complete payment with test XLM
3. Backend should verify transaction and update order status to 'paid'

**Expected flow:**
```
💳 Confirming order payment: { orderId: '...', tx_hash: '...' }
🔍 Verifying transaction on Stellar...
📊 Artisan is registered on-chain, checking payment count...
✅ Current payment count: 1
🎉 First sale! Making artisan visible on map
✅ Payment confirmed. First sale: true
```

## Enhanced Error Logging

The backend now includes detailed error logging:

**When INSERT fails, you'll see:**
1. The Supabase error object
2. Full JSON dump of the error
3. The exact data that was attempted to be inserted
4. Detailed error message returned to frontend

**Example error output:**
```javascript
[F] DB error: PostgrestError {
  message: 'column "artisan_address" does not exist',
  details: 'Perhaps you meant to reference column "merchant_address"',
  hint: null,
  code: '42703'
}
[F] DB error details: {
  "message": "column \"artisan_address\" does not exist",
  "details": "Perhaps you meant to reference column \"merchant_address\"",
  "code": "42703"
}
[F] Order data that failed: {
  "id": "a1b2c3d4-...",
  "artisan_address": "GC...",
  "product_id": null,
  "amount_xlm": "10.00",
  "currency": "XLM",
  "description": "Artesanía hecha a mano",
  "memo": "A1B2C3D4",
  "status": "pending",
  "expires_at": "2025-11-22T15:30:00.000Z"
}
```

## On-Chain Payment Verification Issue

**Separate issue:** On-chain payment counter not incrementing

**Location**: [backend/src/controllers/order.controller.ts:309-326](../src/controllers/order.controller.ts#L309-L326)

**Current behavior:**
```javascript
// Backend only reads on-chain data
const artisan = await artisanRegistryService.getArtisan(order.artisan_address);
console.log(`✅ Current payment count: ${artisan.total_payments}`);
console.log('ℹ️  Payment counter will be incremented by the artisan or admin');
// NOTA: increment_payments requiere firma, debe ser llamado desde el frontend
```

**Why it doesn't auto-increment:**
The `increment_payments()` contract method requires transaction signing. Backend cannot sign transactions (no private key).

**Solution options:**

1. **Frontend calls contract after payment** (recommended):
   ```typescript
   // In Payment.tsx after successful payment
   await artisanRegistryService.incrementPayments(artisanAddress);
   ```

2. **Backend uses service account** (not recommended for security):
   - Requires storing private key in backend
   - Security risk if backend is compromised

3. **Webhook triggers contract call** (advanced):
   - Use Stellar transaction stream
   - Call contract when payment detected
   - Requires additional infrastructure

## Files Modified

1. ✅ `backend/migrations/002_fix_orders_schema.sql` - Migration script
2. ✅ `backend/MIGRATION_INSTRUCTIONS.md` - Step-by-step migration guide
3. ✅ `backend/src/controllers/order.controller.ts` - Enhanced error logging
4. ✅ `backend/DEBUG_GUIDE.md` - This comprehensive debugging guide

## Testing Checklist

- [ ] Run SQL migration in Supabase
- [ ] Verify `artisan_address` column exists
- [ ] Restart backend server
- [ ] Generate QR code from artisan dashboard
- [ ] Check backend logs for success message
- [ ] Verify order appears in database
- [ ] Scan QR with client
- [ ] Complete payment
- [ ] Verify order status updates to 'paid'
- [ ] Check if first sale modal appears (if first payment)
- [ ] Verify artisan appears on map (after first payment)

## Next Steps

1. **Immediate**: Run the database migration
2. **Short-term**: Test QR generation and payment flow
3. **Medium-term**: Implement frontend contract call for payment counter
4. **Long-term**: Consider webhook-based on-chain updates

## Support

If issues persist after migration:

1. Check backend console for `[F]` error messages
2. Copy full error output
3. Check Supabase logs in dashboard
4. Verify environment variables are set:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `FRONTEND_URL`
