# Guía de Logs Detallados - HUMAN Project

## ✅ Cambios realizados para mejorar logs

### 1. Scanner QR (Scan.tsx)
- ✅ Agregados logs detallados para debugging de cámara
- ✅ Cambiado `react-toastify` → `sonner`
- ✅ Logs del QR escaneado (contenido completo)
- ✅ Logs del parsing de order_id

### 2. Proceso de Pago (Payment.tsx)
- ✅ Logs detallados de todo el flujo de pago
- ✅ **MUESTRA EL TRANSACTION ID** en consola
- ✅ Link directo a Stellar Expert
- ✅ Logs de confirmación con backend
- ✅ Cambiado `react-toastify` → `sonner`

---

## 📊 Cómo ver los logs

### Opción 1: Consola del navegador (RECOMENDADO)

1. Abre **http://localhost:5173** en Chrome/Edge
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**
4. Filtra por:
   - `[SCAN]` - Logs del escáner QR
   - `[PAYMENT]` - Logs del proceso de pago
   - `✅` - Operaciones exitosas
   - `❌` - Errores
   - `🔗` - Transaction Hash

### Opción 2: Ver logs del backend

Abre la terminal donde corre el backend:
```bash
cd C:\stellar-workshop\Proyecto\HumanPc\humanProject\backend
npm run dev
```

Verás logs como:
```
POST /api/orders/create
POST /api/orders/:orderId/pay
```

---

## 🧪 Flujo completo de prueba con logs

### Test: Escanear QR y pagar

#### Paso 1: Artesano genera QR
1. Login como artesano
2. Ve a dashboard
3. Click en "Generar QR de pago"
4. Ingresa: monto=10, descripción="Test"
5. Click "Generar QR"

**Logs esperados (Frontend - Consola):**
```
🚀 generateQR called! Amount: 10, Account: G...
📡 Making request to: http://localhost:3001/api/orders/create
```

**Logs esperados (Backend - Terminal):**
```
POST /api/orders/create
```

---

#### Paso 2: Cliente escanea QR

1. Login como cliente (otra cuenta de Google)
2. Ve a dashboard
3. Click "Escanear QR"
4. Click "Abrir Cámara"

**Logs esperados (Frontend - Consola):**
```
📷 [SCAN] Iniciando scanner...
📷 [SCAN] Solicitando permisos de cámara...
📷 [SCAN] Configurando scanner con facingMode: environment
✅ [SCAN] Scanner iniciado correctamente
```

**Si hay error de cámara:**
```
❌ [SCAN] Error al iniciar scanner: NotAllowedError
❌ [SCAN] Error details: {
  message: "Permission denied",
  name: "NotAllowedError"
}
```

**Solución:** Permite acceso a la cámara en el navegador.

---

5. Escanea el QR del artesano

**Logs esperados (Frontend - Consola):**
```
✅ [SCAN] QR escaneado exitosamente!
📄 [SCAN] Contenido del QR: web+stellar:pay?destination=G...&amount=10&memo=abc123...
🔍 [SCAN] Verificando formato del QR...
✅ [SCAN] QR tiene formato válido de pago Stellar
🔑 [SCAN] Order ID extraído: abc123-456-789
✅ [SCAN] Navegando a página de pago...
```

---

#### Paso 3: Cliente confirma pago

1. Verifica monto y descripción
2. Click "Confirmar Pago"

**Logs esperados (Frontend - Consola):**
```
💳 [PAYMENT] Iniciando proceso de pago...
💳 [PAYMENT] Order ID: abc123-456-789
💳 [PAYMENT] Order details: {
  order_id: "abc123-456-789",
  artisan_address: "G...",
  amount_xlm: "10",
  currency: "XLM",
  description: "Test",
  status: "pending"
}
⚙️ [PAYMENT] Preparando asset...
⭐ [PAYMENT] Using native XLM
💸 [PAYMENT] Enviando pago a Stellar blockchain...
💸 [PAYMENT] Detalles del pago: {
  from: "G... (client)",
  to: "G... (artisan)",
  amount: "10.0000000",
  currency: "XLM",
  memo: "abc123-456-789"
}
```

---

**Esperando firma...**
(Usuario debe aprobar en popup de Accesly/Google)

---

**Después de aprobar:**
```
✅ [PAYMENT] ¡Pago enviado exitosamente a Stellar!
🔗 [PAYMENT] Transaction Hash: 1a2b3c4d5e6f7g8h9i0j...
🌐 [PAYMENT] Ver en Stellar Expert: https://stellar.expert/explorer/testnet/tx/1a2b3c4d5e6f7g8h9i0j...
📡 [PAYMENT] Confirmando pago con el backend...
✅ [PAYMENT] Pago confirmado por el backend: {
  success: true,
  message: "Payment confirmed"
}
🎉 [PAYMENT] ¡Proceso de pago completado exitosamente!
🏁 [PAYMENT] Proceso de pago finalizado
```

---

**Logs esperados (Backend - Terminal):**
```
GET /api/orders/abc123-456-789
POST /api/orders/abc123-456-789/pay
Body: {
  tx_hash: "1a2b3c4d5e6f7g8h9i0j...",
  payer_address: "G... (client)"
}
```

---

## 🔗 Obtener Transaction ID

El **Transaction ID** (también llamado Transaction Hash) se muestra en **3 lugares**:

### 1. Consola del navegador (Frontend)
Busca la línea:
```
🔗 [PAYMENT] Transaction Hash: YOUR_TRANSACTION_ID_HERE
```

### 2. URL de Stellar Expert
Busca la línea:
```
🌐 [PAYMENT] Ver en Stellar Expert: https://stellar.expert/explorer/testnet/tx/YOUR_TX_ID
```

Copia el URL completo y ábrelo en el navegador para ver la transacción en blockchain explorer.

### 3. Página de Payment Success
Después de completar el pago, se redirige a `/payment-success` donde se muestra:
- Transaction Hash completo
- Link a Stellar Expert
- Detalles del pago

---

## 🐛 Problemas comunes y soluciones

### Problema 1: Cámara no funciona

**Síntoma:**
```
❌ [SCAN] Error al iniciar scanner: NotAllowedError
```

**Causas:**
1. Permisos de cámara bloqueados en el navegador
2. Otra aplicación está usando la cámara
3. Navegador no soporta `navigator.mediaDevices`

**Solución:**
1. En Chrome/Edge: Click en el icono de cámara en la barra de direcciones → "Permitir siempre"
2. Cierra otras apps que usen la cámara (Zoom, Teams, etc.)
3. Usa Chrome o Edge (Safari/Firefox pueden tener problemas)
4. Usa HTTPS o localhost (HTTP sin localhost no funciona)

---

### Problema 2: QR inválido

**Síntoma:**
```
❌ [SCAN] QR no contiene formato de pago válido
❌ [SCAN] Expected: "stellar:pay" or "order_id="
❌ [SCAN] Actual: https://www.google.com
```

**Causa:** Escaneaste un QR que no es de pago de HUMAN.

**Solución:** Asegúrate de escanear un QR generado por un artesano en HUMAN.

---

### Problema 3: Error al enviar pago

**Síntoma:**
```
❌ [PAYMENT] Error durante el pago: insufficient funds
```

**Causa:** La cuenta del cliente no tiene suficiente XLM.

**Solución:**
1. Ve a https://laboratory.stellar.org/#account-creator?network=test
2. Ingresa la dirección del cliente: `G...`
3. Click "Get test network lumens"
4. Espera 10 segundos
5. Intenta el pago de nuevo

---

### Problema 4: Backend no responde

**Síntoma:**
```
❌ [PAYMENT] Error al confirmar con backend
```

**Causa:** El backend no está corriendo o tiene un error.

**Solución:**
1. Verifica que el backend esté corriendo:
   ```bash
   cd C:\stellar-workshop\Proyecto\HumanPc\humanProject\backend
   npm run dev
   ```
2. Verifica que esté en puerto 3001:
   ```
   Backend running on http://localhost:3001
   ```
3. Verifica logs del backend en la terminal

---

## 📝 Ejemplo completo de logs exitosos

```
// ===== SCANNER =====
📷 [SCAN] Iniciando scanner...
📷 [SCAN] Solicitando permisos de cámara...
📷 [SCAN] Configurando scanner con facingMode: environment
✅ [SCAN] Scanner iniciado correctamente
✅ [SCAN] QR escaneado exitosamente!
📄 [SCAN] Contenido del QR: web+stellar:pay?destination=GCXXX&amount=10&memo=abc123
🔍 [SCAN] Verificando formato del QR...
✅ [SCAN] QR tiene formato válido de pago Stellar
🔑 [SCAN] Order ID extraído: abc123-456-789
✅ [SCAN] Navegando a página de pago...

// ===== PAYMENT =====
💳 [PAYMENT] Iniciando proceso de pago...
💳 [PAYMENT] Order ID: abc123-456-789
💳 [PAYMENT] Order details: {...}
⚙️ [PAYMENT] Preparando asset...
⭐ [PAYMENT] Using native XLM
💸 [PAYMENT] Enviando pago a Stellar blockchain...
💸 [PAYMENT] Detalles del pago: {...}
✅ [PAYMENT] ¡Pago enviado exitosamente a Stellar!
🔗 [PAYMENT] Transaction Hash: 1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t
🌐 [PAYMENT] Ver en Stellar Expert: https://stellar.expert/explorer/testnet/tx/1a2b3c...
📡 [PAYMENT] Confirmando pago con el backend...
✅ [PAYMENT] Pago confirmado por el backend: {...}
🎉 [PAYMENT] ¡Proceso de pago completado exitosamente!
🏁 [PAYMENT] Proceso de pago finalizado
```

---

## 🎯 Resumen

### Archivos modificados:
1. ✅ `src/pages/Scan.tsx` - Logs detallados del scanner + fix sonner
2. ✅ `src/pages/Payment.tsx` - Logs detallados del pago + Transaction ID + fix sonner

### Cómo obtener Transaction ID:
1. Abre **F12 → Console**
2. Busca la línea: `🔗 [PAYMENT] Transaction Hash:`
3. Copia el hash completo
4. O busca: `🌐 [PAYMENT] Ver en Stellar Expert:` y abre el link

### Backend sin cambios:
- ❌ NO se modificó el backend
- ✅ Backend sigue funcionando igual

---

**¡Listo!** Ahora tienes logs detallados en consola para debuggear y obtener el Transaction ID.
