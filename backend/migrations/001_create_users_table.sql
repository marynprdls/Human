-- ================================
-- TABLA: users
-- Usuarios registrados (artesanos y clientes)
-- ================================

CREATE TABLE IF NOT EXISTS users (
  stellar_address VARCHAR(56) PRIMARY KEY,
  google_sub VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('artisan', 'client')),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  photo_url TEXT,

  -- Solo para artesanos
  business_name VARCHAR(255),
  business_description TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_name VARCHAR(255),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_google_sub ON users(google_sub);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude) WHERE role = 'artisan';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE users IS 'Usuarios registrados (artesanos y clientes con login social)';
COMMENT ON COLUMN users.stellar_address IS 'Dirección Stellar (llave primaria)';
COMMENT ON COLUMN users.google_sub IS 'Google sub ID (único por usuario de Google)';
COMMENT ON COLUMN users.role IS 'Rol del usuario: artisan o client';
COMMENT ON COLUMN users.business_name IS 'Nombre del negocio (solo artesanos)';
COMMENT ON COLUMN users.latitude IS 'Latitud del negocio (solo artesanos)';
COMMENT ON COLUMN users.longitude IS 'Longitud del negocio (solo artesanos)';
