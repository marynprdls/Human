# Changelog - Sesión de UI Upgrade & OAuth Fix

**Fecha:** 2025-11-22
**Duración:** ~3 horas
**Objetivo:** Integrar UI profesional de VercelApp + Solucionar problema de login con Google OAuth

---

## 📝 Resumen ejecutivo

### ✅ Completado:
1. Upgrade completo de UI (shadcn/ui + Tailwind v4)
2. Rediseño de 4 páginas principales
3. Fix crítico de Google OAuth (CORS 403)
4. Puerto cambiado de 5179 → 5173
5. Sistema de notificaciones mejorado (Sonner)

### ❌ NO modificado:
- **Backend:** CERO cambios en el backend
- **Smart contracts:** Sin modificaciones
- **Base de datos:** Sin cambios de schema
- **Lógica de negocio:** Sin cambios

---

## 🔧 Cambios técnicos detallados

### 1. Instalación de dependencias (package.json)

**Nuevas dependencias agregadas:**

```json
{
  "dependencies": {
    "sonner": "^1.7.1",
    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-alert-dialog": "^1.1.4",
    "@radix-ui/react-aspect-ratio": "^1.1.1",
    "@radix-ui/react-avatar": "^1.1.2",
    "@radix-ui/react-checkbox": "^1.1.3",
    "@radix-ui/react-collapsible": "^1.1.2",
    "@radix-ui/react-context-menu": "^2.2.4",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-hover-card": "^1.1.4",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-menubar": "^1.1.4",
    "@radix-ui/react-navigation-menu": "^1.2.2",
    "@radix-ui/react-popover": "^1.1.4",
    "@radix-ui/react-progress": "^1.1.1",
    "@radix-ui/react-radio-group": "^1.2.2",
    "@radix-ui/react-scroll-area": "^1.2.2",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slider": "^1.2.2",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-switch": "^1.1.2",
    "@radix-ui/react-tabs": "^1.1.2",
    "@radix-ui/react-toast": "^1.2.4",
    "@radix-ui/react-toggle": "^1.1.1",
    "@radix-ui/react-toggle-group": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.6",
    "lucide-react": "^0.468.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49"
  }
}
```

**Dependencias removidas:**
```json
{
  "react-toastify": "REMOVIDO - Reemplazado por Sonner"
}
```

---

### 2. Configuración de PostCSS (postcss.config.js)

**Archivo:** `postcss.config.js` (NUEVO)

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

**Razón:** Tailwind CSS v4 requiere el plugin `@tailwindcss/postcss` en lugar del plugin antiguo.

---

### 3. Configuración de Vite (vite.config.ts)

**Cambios:**

```diff
export default defineConfig(() => {
  return {
    // ... otros configs
    envPrefix: "PUBLIC_",
    server: {
+     port: 5173,  // Configurado explícitamente
      proxy: {
        "/friendbot": {
          target: "http://localhost:8000/friendbot",
          changeOrigin: true,
        },
      },
    },
  };
});
```

**Razón:** Volver al puerto original 5173 (antes estaba en 5179 porque otros puertos estaban ocupados).

---

### 4. Estilos globales (src/index.css)

**Cambios:**

```diff
- @apply border-border;
- @apply bg-background text-foreground;

+ border-color: hsl(var(--border));
+ background-color: hsl(var(--background));
+ color: hsl(var(--foreground));
```

**Razón:** Tailwind v4 no soporta `@apply` con variables CSS personalizadas. Se convirtió a CSS puro.

---

### 5. Login Page (src/pages/Login.tsx)

**Cambios principales:**

#### A. Imports:
```diff
- import PrimaryButton from '@/components/primary-button';
+ // Removido, ahora usa botón oficial de Google
```

#### B. Google OAuth - Método de autenticación:
```diff
- // Antiguo: Usaba prompt() que causaba error 403
- window.google.accounts.id.prompt();

+ // Nuevo: Renderiza botón oficial de Google
+ window.google.accounts.id.renderButton(
+   googleButtonRef.current,
+   {
+     theme: 'outline',
+     size: 'large',
+     width: 300,
+     text: 'continue_with',
+     shape: 'rectangular',
+     logo_alignment: 'left',
+   }
+ );
```

#### C. Botón de login en JSX:
```diff
- {/* Login Button */}
- <div className="w-full flex justify-center animate-fadeIn animation-delay-300">
-   <PrimaryButton onClick={handleManualLogin} variant="primary">
-     <span>Continuar con Google</span>
-   </PrimaryButton>
- </div>
- <div ref={googleButtonRef} className="hidden"></div>

+ {/* Google Sign-In Button */}
+ <div className="w-full flex justify-center animate-fadeIn animation-delay-300">
+   <div ref={googleButtonRef} className="flex justify-center"></div>
+ </div>
```

**Razón:** El método `prompt()` causaba error 403 de CORS. El método `renderButton()` es más confiable y no tiene problemas de CORS.

---

### 6. Role Select Page (src/pages/RoleSelect.tsx)

**Cambios:**
- ✅ Rediseñado completamente con shadcn/ui
- ✅ Agregados iconos de Lucide React (Store, User)
- ✅ Tarjetas con hover effects
- ✅ Animaciones de entrada (fadeIn)
- ✅ Link a Stellar Expert para ver cuenta

**Estructura anterior:**
```tsx
// Botones simples con gradientes
<button>Soy Artesano</button>
<button>Soy Cliente</button>
```

**Estructura nueva:**
```tsx
<PrimaryButton variant="primary">
  <div className="flex flex-col items-center gap-3 py-4">
    <Store className="w-8 h-8" />
    <div className="text-center">
      <div className="text-lg font-bold mb-1">Soy Artesano</div>
      <div className="text-sm opacity-80">Genera QR para recibir pagos</div>
    </div>
  </div>
</PrimaryButton>
```

---

### 7. Artisan Dashboard (src/pages/ArtisanDashboard.tsx)

**Cambios principales:**

#### A. Layout:
```diff
- return <div>...</div>

+ return (
+   <MobileLayout showBottomNav activeTab="home">
+     ...
+   </MobileLayout>
+ )
```

#### B. Balance Card:
```diff
- <div>Balance: {balance} XLM</div>

+ <Card className="bg-foreground text-background">
+   <div className="space-y-2">
+     <p className="text-sm opacity-70">Saldo disponible</p>
+     <p className="text-5xl font-bold">{balance}</p>
+     <div className="flex items-center justify-between">
+       <p className="text-sm opacity-70">XLM</p>
+       <a href={stellarExpertLink} target="_blank">
+         Ver en Stellar Expert
+       </a>
+     </div>
+   </div>
+ </Card>
```

#### C. QR Generation:
- Agregado formulario colapsible (toggle con showQRForm)
- Inputs de shadcn/ui para monto y descripción
- Botones de acción con estados loading/disabled
- Display de QR con imagen grande y borders

#### D. Stats Grid:
```tsx
<div className="grid grid-cols-2 gap-4">
  <Card padding="md" className="bg-secondary">
    <p className="text-sm text-muted-foreground">Pagos verificados</p>
    <p className="text-3xl font-bold">{contractData.total_payments}</p>
    <button onClick={loadContractData}>
      <RefreshCw className={loadingContract ? 'animate-spin' : ''} />
    </button>
  </Card>

  <Card padding="md" className="bg-secondary">
    <p className="text-sm text-muted-foreground">Estado</p>
    <p>{contractData?.verified ? 'Verificado' : 'Pendiente'}</p>
  </Card>
</div>
```

---

### 8. Client Dashboard (src/pages/ClientDashboard.tsx)

**Cambios:**
- ✅ MobileLayout con bottom navigation
- ✅ Balance card grande (similar a artisan)
- ✅ Botones de acción: Scan QR + Copy Address
- ✅ Transaction history component
- ✅ Logout button en header

---

### 9. App.tsx

**Cambios:**

```diff
- import { ToastContainer } from 'react-toastify';
- import 'react-toastify/dist/ReactToastify.css';

+ import { Toaster } from 'sonner';

// ...

- <ToastContainer position="top-right" autoClose={3000} />
+ <Toaster position="top-right" richColors />
```

**Razón:** Sonner tiene mejor UX, es más ligero y tiene animaciones suaves.

---

### 10. NotificationProvider.tsx

**Cambios:**

```diff
- import './NotificationProvider.css';  // REMOVIDO
```

**Razón:** El archivo CSS causaba conflictos con Tailwind v4.

---

### 11. Primary Button Component (src/components/primary-button.tsx)

**Cambios temporales (para debugging):**

```diff
return (
  <button
-   onClick={onClick}
+   onClick={(e) => {
+     console.log('🔘 Button clicked!', e);
+     onClick?.();
+   }}
    disabled={disabled}
    className={finalClassName}
+   type="button"
  >
    {children}
  </button>
)
```

**Nota:** Estos logs pueden ser removidos en producción.

---

## 📊 Comparación antes/después

### Antes:
```
Login: Botón personalizado → error 403 CORS
UI: Gradientes simples, sin componentes reutilizables
Toasts: react-toastify (grande, poco customizable)
Tailwind: v3 con @apply
Puerto: Variable (5173, 5174, 5179...)
```

### Después:
```
Login: Botón oficial de Google → funciona sin CORS
UI: shadcn/ui con 56+ componentes profesionales
Toasts: Sonner (ligero, animaciones suaves)
Tailwind: v4 con PostCSS puro
Puerto: 5173 (fijo y configurado)
```

---

## 🔍 Archivos NO modificados

### Backend (./backend/):
- ✅ src/server.ts
- ✅ src/routes/*.ts
- ✅ src/controllers/*.ts
- ✅ src/services/*.ts
- ✅ package.json (backend)
- ✅ .env (backend)

### Smart Contracts:
- ✅ Ningún cambio en contratos
- ✅ WASM files sin tocar
- ✅ Contract IDs sin cambiar

### Base de datos:
- ✅ Schema de Supabase sin modificar
- ✅ No se crearon/eliminaron tablas
- ✅ No se modificaron columnas

### Otros:
- ✅ .env (frontend) - Solo se leen valores, no se modificaron
- ✅ index.html - Sin cambios (ya tenía Google script)
- ✅ public/ - Sin cambios

---

## 🐛 Bugs corregidos

### Bug 1: Error 403 en Google OAuth
**Síntoma:** Al hacer clic en "Continuar con Google" aparecía error 403 en consola y no se mostraba el popup de login.

**Causa:** El método `window.google.accounts.id.prompt()` tiene restricciones de CORS más estrictas que requieren que el origen esté 100% verificado y propagado en Google Cloud Console.

**Solución:** Cambiar a `window.google.accounts.id.renderButton()` que renderiza el botón oficial de Google directamente en el DOM, evitando el problema de CORS.

**Archivos afectados:**
- [src/pages/Login.tsx](./src/pages/Login.tsx)

**Commit equivalente:**
```
fix(auth): use renderButton instead of prompt to avoid CORS 403

- Remove prompt() call that caused 403 error
- Implement renderButton() with official Google button
- Remove custom button in favor of native Google UI
```

---

### Bug 2: Tailwind CSS no compilaba
**Síntoma:** Estilos no se aplicaban, página se veía sin diseño.

**Causa:** Faltaba `postcss.config.js` con el nuevo plugin de Tailwind v4.

**Solución:** Crear postcss.config.js con `@tailwindcss/postcss`.

**Archivos afectados:**
- [postcss.config.js](./postcss.config.js) (creado)
- package.json (agregado `@tailwindcss/postcss`)

---

### Bug 3: Build fallaba con error de @apply
**Síntoma:** `npm run build` fallaba con error "Cannot apply unknown utility class".

**Causa:** Tailwind v4 no soporta `@apply` con variables CSS custom properties.

**Solución:** Convertir todas las reglas `@apply` a CSS puro.

**Archivos afectados:**
- [src/index.css](./src/index.css)

---

## 📦 Nuevos componentes agregados

### UI Components (./src/components/ui/):
- accordion.tsx
- alert-dialog.tsx
- avatar.tsx
- button.tsx
- card.tsx
- checkbox.tsx
- dialog.tsx
- dropdown-menu.tsx
- input.tsx
- label.tsx
- popover.tsx
- select.tsx
- separator.tsx
- switch.tsx
- tabs.tsx
- toast.tsx
- tooltip.tsx
- ... y 39 componentes más

### Custom Components:
- mobile-layout.tsx - Layout con bottom nav
- primary-button.tsx - Botón principal customizable

---

## 🚀 Comandos para testing

### Iniciar ambos servidores:
```bash
# Terminal 1: Frontend
cd C:\stellar-workshop\Proyecto\HumanPc\humanProject
npm run dev
# → http://localhost:5173

# Terminal 2: Backend
cd C:\stellar-workshop\Proyecto\HumanPc\humanProject\backend
npm run dev
# → http://localhost:3001
```

### Build de producción:
```bash
cd C:\stellar-workshop\Proyecto\HumanPc\humanProject
npm run build
# Output: dist/
```

### Verificar health del backend:
```bash
curl http://localhost:3001/health
# Expected: {"status":"ok","network":"TESTNET"}
```

---

## 📚 Referencias

### Documentación consultada:
- [Google Identity Services - renderButton](https://developers.google.com/identity/gsi/web/reference/js-reference#google.accounts.id.renderButton)
- [Tailwind CSS v4 - PostCSS Plugin](https://tailwindcss.com/docs/installation/using-postcss)
- [shadcn/ui](https://ui.shadcn.com/)
- [Sonner](https://sonner.emilkowal.ski/)

### Archivos de referencia:
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Guía completa de testing
- [GOOGLE_OAUTH_FIX.md](./GOOGLE_OAUTH_FIX.md) - Troubleshooting de OAuth
- [IMPLEMENTATION_SUMMARY.md](../Documentos/IMPLEMENTATION_SUMMARY.md) - Arquitectura completa

---

## ⏭️ Próximos pasos

### Pendientes:
- [ ] Implementar mapa de artesanos (Fase 8)
- [ ] Remover logs de debug del PrimaryButton
- [ ] Agregar tests unitarios
- [ ] Agregar tests E2E
- [ ] Optimizar bundle size (actualmente 3.3MB)
- [ ] Implementar code splitting
- [ ] Agregar error boundaries
- [ ] Implementar retry automático en pagos

### Mejoras opcionales:
- [ ] Modo oscuro
- [ ] Internacionalización (i18n)
- [ ] PWA (Progressive Web App)
- [ ] Notificaciones push
- [ ] Soporte para múltiples monedas (USDC, yUSDC)

---

**Fin del Changelog**
