# Guía de Testing - HUMAN Project

## Resumen de cambios en esta sesión

### 🎨 Frontend Changes

#### 1. **UI Upgrade (Fases 1-7 completadas)**
- ✅ Instalado shadcn/ui con 56+ componentes
- ✅ Migrado a Tailwind CSS v4 con PostCSS
- ✅ Rediseñadas todas las vistas principales:
  - Login page (welcome design)
  - Role selection page (choose-type design)
  - Artisan dashboard (merchant/home design)
  - Client dashboard (user/home design)
- ✅ Integrado Sonner para toast notifications (reemplazó react-toastify)
- ✅ Mobile-first design (430px container)

#### 2. **Google OAuth Fix**
- ✅ Cambiado de `prompt()` a `renderButton()` para evitar CORS 403
- ✅ Puerto configurado en 5173
- ✅ Botón oficial de Google renderizado directamente

#### 3. **Archivos modificados:**
```
src/pages/Login.tsx                  - OAuth fix + UI redesign
src/pages/RoleSelect.tsx             - UI redesign
src/pages/ArtisanDashboard.tsx       - UI redesign + blockchain features
src/pages/ClientDashboard.tsx        - UI redesign
src/components/primary-button.tsx    - Logs de debug (temporal)
src/index.css                        - Tailwind v4 compatibility
vite.config.ts                       - Puerto 5173
postcss.config.js                    - Creado nuevo
tailwind.config.js                   - Configuración de diseño
package.json                         - Nuevas dependencias
```

### 🔧 Backend Changes

**NINGÚN CAMBIO** - El backend NO fue modificado en esta sesión.

Backend sigue corriendo en:
- Puerto: 3001
- Base de datos: Supabase conectada ✅
- Stellar: Testnet conectada ✅ (ledger 1730573)
- Endpoints: Sin cambios

---

## 🧪 Tests a realizar

### Test 1: Login con Google OAuth

**Precondición:**
- Frontend en http://localhost:5173
- Backend en http://localhost:3001
- Google Client ID configurado en .env

**Pasos:**
1. Abre http://localhost:5173 en el navegador
2. Deberías ver el botón oficial de Google "Continuar con Google"
3. Haz clic en el botón
4. Selecciona una cuenta de Google
5. Acepta los permisos

**Resultado esperado:**
- ✅ Se muestra el popup de Google
- ✅ Después de seleccionar cuenta, se redirige a `/role-select`
- ✅ En consola del navegador se ve: `📩 Received credential response`
- ✅ En consola del navegador se ve: `[ok] User not registered, redirecting to role select`

**Logs esperados (Browser Console):**
```
[ok] Rendering Google Sign-In button
[ok] Google Sign-In button rendered successfully
📩 Received credential response
🔐 Processing Google login...
👤 User info: {sub: "...", name: "...", email: "..."}
🔍 Checking if user is registered...
ℹ️ User not registered yet
[ok] Login successful!
ℹ️ User not registered, redirecting to role select
```

**Logs esperados (Backend - ninguno nuevo, solo existentes):**
```
Backend ya estaba corriendo, no hay nuevos logs esperados
```

---

### Test 2: Registro como Artesano

**Precondición:**
- Login exitoso (Test 1)
- Usuario en `/role-select`

**Pasos:**
1. Haz clic en el botón "Soy Artesano"
2. Rellena el formulario:
   - Nombre: Tu nombre
   - Nombre del negocio: Nombre de tu artesanía
   - Ubicación: Tu ciudad
3. Haz clic en "Registrarse"

**Resultado esperado:**
- ✅ Se crea usuario en Supabase
- ✅ Se registra artesano en Soroban (smart contract)
- ✅ Se redirige a `/artisan-dashboard`
- ✅ Se muestra balance XLM
- ✅ Se muestra contador de pagos (0 inicialmente)
- ✅ Estado: "No registrado" o "Pendiente"

**Logs esperados (Backend):**
```
POST /api/users/register-artisan
GET /api/users/by-google/:googleSub
(Posibles llamadas a Stellar Horizon)
```

---

### Test 3: Generar QR de pago

**Precondición:**
- Artesano registrado y en dashboard

**Pasos:**
1. Haz clic en "Generar QR de pago"
2. Ingresa monto: 10
3. Ingresa descripción: "Artesanía"
4. Haz clic en "Generar QR"

**Resultado esperado:**
- ✅ Se muestra código QR
- ✅ Se muestra monto: "10 XLM"
- ✅ Se muestra descripción: "Artesanía"
- ✅ Botones: "Generar Nuevo QR" y "Ocultar QR"

**Logs esperados (Backend):**
```
POST /api/orders/create
Response: {
  order_id: "...",
  qr_data_url: "data:image/png;base64,..."
}
```

**Logs esperados (Frontend):**
```
🚀 generateQR called! Amount: 10, Account: G...
📡 Making request to: http://localhost:3001/api/orders/create
```

---

### Test 4: Registro como Cliente

**Precondición:**
- Nueva sesión de navegador (modo incógnito)
- Login exitoso con otra cuenta de Google

**Pasos:**
1. Login con Google
2. Selecciona "Soy Cliente"
3. Ingresa tu nombre
4. Haz clic en "Registrarse"

**Resultado esperado:**
- ✅ Se redirige a `/client-dashboard`
- ✅ Se muestra balance XLM
- ✅ Se muestra botón "Escanear QR"
- ✅ Se muestra botón "Copiar dirección"

---

### Test 5: Escanear QR y pagar

**Precondición:**
- Cliente registrado en dashboard
- Artesano tiene QR generado (Test 3)

**Pasos:**
1. Como cliente, haz clic en "Escanear QR"
2. Permite acceso a la cámara
3. Escanea el QR del artesano
4. Verifica monto y descripción
5. Haz clic en "Confirmar pago"

**Resultado esperado:**
- ✅ Se muestra spinner "Procesando pago..."
- ✅ Se ejecuta transacción en Stellar
- ✅ Se incrementa contador en Soroban
- ✅ Se muestra toast: "¡Pago exitoso!"
- ✅ Balance del cliente disminuye
- ✅ Balance del artesano aumenta
- ✅ Contador del artesano incrementa en 1

**Logs esperados (Backend):**
```
POST /api/payments/process
(Llamadas a Stellar Horizon)
(Llamadas a Soroban para incrementar contador)
```

---

### Test 6: Verificar transacciones en blockchain

**Pasos:**
1. Copia la dirección Stellar del artesano (desde dashboard)
2. Abre https://stellar.expert/explorer/testnet
3. Busca la dirección
4. Verifica transacciones recientes

**Resultado esperado:**
- ✅ Se muestran las transacciones de pago
- ✅ Se muestra el monto correcto
- ✅ Se muestra el memo (si se usó)

---

## 🐛 Debug Mode

### Ver logs detallados en el navegador:

1. Abre DevTools (F12)
2. Ve a Console
3. Filtra por:
   - `[ok]` - Operaciones exitosas
   - `[F]` - Errores críticos
   - `ℹ️` - Información
   - `🔐` - Autenticación
   - `📩` - Credenciales recibidas

### Ver logs del backend:

Los logs del backend se muestran en la terminal donde corre `npm run dev`:
```bash
cd C:\stellar-workshop\Proyecto\HumanPc\humanProject\backend
npm run dev
```

### Ver logs de Vite (frontend):

Los logs del frontend se muestran en la terminal donde corre `npm run dev`:
```bash
cd C:\stellar-workshop\Proyecto\HumanPc\humanProject
npm run dev
```

---

## 📊 Estado actual del sistema

### Frontend (http://localhost:5173)
- ✅ Vite 7.2.2 corriendo
- ✅ Hot Module Replacement (HMR) activo
- ✅ Tailwind CSS v4 compilando
- ✅ Google OAuth configurado
- ✅ Todas las rutas funcionando

### Backend (http://localhost:3001)
- ✅ Express + TypeScript corriendo
- ✅ Supabase conectada
- ✅ Stellar Testnet conectada (ledger 1730573)
- ✅ Health check: http://localhost:3001/health
- ✅ Nodemon monitoreando cambios

### Base de datos (Supabase)
- ✅ Tablas: users, orders, transactions
- ✅ Conexión activa

### Blockchain (Stellar Testnet)
- ✅ Red: TESTNET
- ✅ Smart contract: CCTN3PGFH6WT2T7IRNN543NGQV3TU2RZVDK5E4M4BAFPJGKKVIS46NPO
- ✅ Horizon URL: https://horizon-testnet.stellar.org
- ✅ Soroban RPC: https://soroban-testnet.stellar.org

---

## 🔍 Troubleshooting

### Error: "Google no está listo"
**Causa:** Script de Google no cargó
**Solución:** Recarga la página (Ctrl+F5)

### Error: "Failed to load resource: 403"
**Causa:** Google OAuth CORS (ya solucionado con renderButton)
**Solución:** Ya está implementada la solución con renderButton

### Error: "Iniciando sesión..." infinito
**Causa:** Backend no responde o error en loginWithGoogle
**Solución:**
1. Verifica que el backend esté corriendo
2. Revisa logs del backend
3. Verifica que PUBLIC_API_URL sea http://localhost:3001

### Error: Balance no se muestra
**Causa:** Wallet sin fondos en testnet
**Solución:** Usa Friendbot para obtener XLM de testnet

---

## ✅ Checklist de funcionalidades

### Autenticación
- [x] Login con Google OAuth
- [x] Generación automática de wallet Stellar
- [x] Persistencia de sesión (localStorage)
- [x] Logout

### Registro
- [x] Registro como artesano
- [x] Registro como cliente
- [x] Registro en Soroban (smart contract)
- [x] Guardado en Supabase

### Pagos
- [x] Generar QR de pago
- [x] Escanear QR
- [x] Procesar pago en Stellar
- [x] Incrementar contador en Soroban
- [x] Actualizar estado en DB

### Dashboard Artesano
- [x] Ver balance XLM
- [x] Generar QR con monto/descripción
- [x] Ver contador de pagos verificados (Soroban)
- [x] Ver estado de verificación
- [x] Ver historial de transacciones
- [x] Link a Stellar Expert

### Dashboard Cliente
- [x] Ver balance XLM
- [x] Escanear QR para pagar
- [x] Copiar dirección Stellar
- [x] Ver historial de transacciones

### Admin Panel
- [x] Ver artesanos no verificados
- [x] Verificar artesanos
- [x] Actualizar estado en DB y Soroban

### UI/UX
- [x] Diseño mobile-first
- [x] Tema fintech (black/white/teal)
- [x] Toasts para notificaciones
- [x] Loading states
- [x] Animaciones suaves
- [x] Botones con estados hover/active

---

## 🚀 Próximos pasos (pendientes)

### Fase 8: Mapa de artesanos
- [ ] Instalar React Leaflet
- [ ] Crear componente de mapa
- [ ] Mostrar marcadores de artesanos
- [ ] Filtrar por verificados/no verificados
- [ ] Click en marcador → ver perfil

### Mejoras adicionales
- [ ] Tests unitarios (Jest + React Testing Library)
- [ ] Tests E2E (Playwright)
- [ ] Manejo de errores robusto
- [ ] Retry automático en pagos fallidos
- [ ] Exportar historial a CSV/PDF
- [ ] Notificaciones push
- [ ] Modo oscuro
- [ ] Soporte para USDC/yUSDC
