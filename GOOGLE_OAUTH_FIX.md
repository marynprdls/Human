# Solución para Error 403 de Google OAuth

## Problema
`[GSI_LOGGER]: The given origin is not allowed for the given client ID`

## Ya configurado en Google Cloud Console
✅ http://localhost:3000
✅ http://localhost:5173
✅ http://localhost:5174

## Pasos para solucionar

### 1. Esperar propagación (5-10 minutos)
Google puede tardar hasta 10 minutos en propagar los cambios de configuración.

### 2. Limpiar caché del navegador
1. Abre DevTools (F12)
2. Click derecho en el botón de recargar
3. Selecciona "Vaciar caché y recargar página"
4. O usa Ctrl+Shift+Delete y limpia:
   - Cookies y otros datos del sitio
   - Imágenes y archivos en caché
   - Solo de la última hora

### 3. Verificar configuración exacta en Google Cloud Console
1. Ve a https://console.cloud.google.com/apis/credentials
2. Busca el Client ID: `390552607520-3eaqgmt16nur35hfl4t60j7abk7691tv`
3. Verifica que en "Authorized JavaScript origins" esté EXACTAMENTE:
   - `http://localhost:5173` (sin trailing slash)
4. Verifica que en "Authorized redirect URIs" esté:
   - `http://localhost:5173`
   - `http://localhost:5173/`
5. Haz clic en GUARDAR de nuevo

### 4. Probar en modo incógnito
Abre una ventana de incógnito y prueba http://localhost:5173

### 5. Si nada funciona: Revisar si el Client ID es correcto
Verifica que el Client ID en `.env` coincida exactamente con el de Google Cloud Console.

Archivo: `.env`
```
PUBLIC_GOOGLE_CLIENT_ID="390552607520-3eaqgmt16nur35hfl4t60j7abk7691tv.apps.googleusercontent.com"
```

### 6. Última opción: Crear un nuevo Client ID
Si después de 10 minutos sigue sin funcionar, crea un nuevo OAuth 2.0 Client ID:
1. Ve a APIs & Services → Credentials
2. Click en "+ CREATE CREDENTIALS" → "OAuth client ID"
3. Tipo: "Web application"
4. Authorized JavaScript origins:
   - http://localhost:3000
   - http://localhost:5173
   - http://localhost:5174
5. Authorized redirect URIs:
   - http://localhost:5173
   - http://localhost:5173/
6. Copia el nuevo Client ID y actualiza `.env`

## Verificación
Después de hacer los cambios, deberías ver en la consola:
✅ Google One Tap se muestra correctamente
✅ No hay error 403
✅ Aparece el popup de login de Google
