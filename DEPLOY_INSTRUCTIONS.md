# 🚀 Instrucciones para Desplegar el Contrato Actualizado

## ✅ Contrato ya compilado y optimizado

**Archivo**: `target/wasm32v1-none/release/artisan_registry.optimized.wasm`
**Tamaño**: 2816 bytes
**Hash**: 5dcbe1e8f85d61dd3ae7de90f7c1e4c3dc81b11079008c199360532c1ce018f5

## 📋 Opción 1: Deploy con tu Secret Key (RECOMENDADO)

Ejecuta este comando reemplazando `<TU_SECRET_KEY>` con tu secret key real (empieza con S):

```bash
cd "C:\stellar-workshop\Proyecto\HumanPc\humanProject"

stellar contract deploy \
  --wasm target/wasm32v1-none/release/artisan_registry.optimized.wasm \
  --source-account <TU_SECRET_KEY> \
  --network testnet
```

**Ejemplo**:
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/artisan_registry.optimized.wasm \
  --source-account SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX \
  --network testnet
```

## 📋 Opción 2: Deploy con identidad "deployer"

Ya creé una identidad "deployer" con fondos. Para usarla:

```bash
cd "C:\stellar-workshop\Proyecto\HumanPc\humanProject"

# Ver la address pública
stellar keys address deployer

# Deploy (desde la carpeta del proyecto)
stellar --config-dir "C:\Users\juanp\.config\stellar" contract deploy \
  --wasm target/wasm32v1-none/release/artisan_registry.optimized.wasm \
  --source deployer \
  --network testnet
```

## 📝 Después del Deployment

Una vez que obtengas el nuevo CONTRACT_ID (ej: `CAXXXXXXXXXXX...`), sigue estos pasos:

### 1. Actualizar .env

```env
PUBLIC_ARTISAN_REGISTRY_CONTRACT_ID=<NUEVO_CONTRACT_ID_AQUI>
```

### 2. Reinicializar el contrato

Desde el Admin Panel de tu app o con stellar CLI:

```bash
stellar contract invoke \
  --id <NUEVO_CONTRACT_ID> \
  --source <TU_SECRET_KEY> \
  --network testnet \
  -- \
  initialize \
  --admin <TU_PUBLIC_ADDRESS>
```

### 3. Volver a registrar artesanos

Los artesanos necesitarán volver a registrarse en el nuevo contrato desde el ArtisanRegister page.

## 🔍 Verificar el deployment

```bash
# Ver detalles del contrato
stellar contract id wasm --wasm target/wasm32v1-none/release/artisan_registry.optimized.wasm --network testnet

# Ver el admin del contrato
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  -- \
  get_admin
```

## ⚡ Cambios en esta versión

- ✅ `increment_payments` ahora requiere autenticación del artesano
- ✅ Evento `payment` publicado cuando se incrementa el contador
- ✅ Mejor seguridad: solo el artesano puede incrementar su propio contador

## 🎯 Flujo completo después del deploy

1. Artesano se registra → `register_artisan()`
2. Admin verifica → `verify_artisan()`
3. Cliente paga → Backend registra en Supabase
4. Artesano hace clic en "Registrar pago" → `increment_payments()`
5. Contador se incrementa on-chain
6. Si es el primer pago → Modal de felicitaciones 🎉
