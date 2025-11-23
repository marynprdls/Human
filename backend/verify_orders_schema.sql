-- Ver las columnas de la tabla orders
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- Ver datos de ejemplo
SELECT * FROM orders LIMIT 3;
