-- HUMAN P2P Payment Platform Database Schema
-- This schema supports the current application code

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (stores both artisans and clients)
CREATE TABLE IF NOT EXISTS users (
  stellar_address VARCHAR(56) PRIMARY KEY,
  google_sub VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('artisan', 'client')),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  photo_url TEXT,
  business_name VARCHAR(255),
  business_description TEXT,
  phone VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table (replaces old payments/qr_codes tables)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_address VARCHAR(56) REFERENCES users(stellar_address) NOT NULL,
  product_id UUID,
  amount_xlm DECIMAL(20, 7) NOT NULL CHECK (amount_xlm > 0),
  currency VARCHAR(10) DEFAULT 'XLM',
  description TEXT DEFAULT 'Pago',
  memo VARCHAR(28),
  qr_data TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'expired', 'cancelled')),
  payer_address VARCHAR(56),
  tx_hash VARCHAR(64),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

-- Transactions table (for history tracking)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stellar_address VARCHAR(56) REFERENCES users(stellar_address) NOT NULL,
  tx_hash VARCHAR(64) UNIQUE NOT NULL,
  type VARCHAR(20) CHECK (type IN ('payment', 'received', 'other')),
  amount DECIMAL(20, 7),
  asset VARCHAR(20),
  memo TEXT,
  from_address VARCHAR(56),
  to_address VARCHAR(56),
  ledger BIGINT,
  created_at TIMESTAMP NOT NULL,
  indexed_at TIMESTAMP DEFAULT NOW()
);

-- Products table (optional, for future use)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artisan_address VARCHAR(56) REFERENCES users(stellar_address),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price_xlm DECIMAL(20, 7) NOT NULL CHECK (price_xlm > 0),
  image_url TEXT,
  category VARCHAR(100),
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude) WHERE role = 'artisan';

CREATE INDEX IF NOT EXISTS idx_orders_artisan ON orders(artisan_address);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_tx_hash ON orders(tx_hash);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_address ON transactions(stellar_address);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_artisan ON products(artisan_address);

-- Update trigger for users.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
