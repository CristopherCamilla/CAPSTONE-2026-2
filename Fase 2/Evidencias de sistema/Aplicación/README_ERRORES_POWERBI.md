# Manejo de Errores de Power BI en Consola

## 📋 Resumen

Los errores que aparecen en la consola relacionados con Power BI son **normales y esperados** cuando se embebe un iframe de Power BI. Estos errores **NO afectan la funcionalidad** de tu aplicación.

## 🔍 Errores Comunes

### 1. **CORS Errors (Cross-Origin Request Blocked)**
```
Solicitud de origen cruzado bloqueada: dc.services.visualstudio.com
```
- **Causa**: Power BI intenta enviar telemetría a Microsoft
- **Impacto**: Ninguno - es solo telemetría/análisis
- **Solución**: Se puede ignorar o filtrar

### 2. **Cookie Warnings**
```
La cookie 'cookietest' ha sido rechazada...
La cookie 'ai_session' pronto será rechazada...
```
- **Causa**: Políticas de cookies de terceros (Power BI)
- **Impacto**: Ninguno - Power BI funciona sin estas cookies
- **Solución**: Se puede ignorar o filtrar

### 3. **Partitioned Cookie Warnings**
```
cookie particionada o acceso de almacenamiento...
```
- **Causa**: Políticas de privacidad del navegador
- **Impacto**: Ninguno
- **Solución**: Se puede ignorar o filtrar

## ✅ Soluciones Implementadas

### 1. **Filtro de Consola (Desarrollo)**
Se creó `src/utils/consoleFilter.ts` que:
- ✅ Filtra automáticamente errores de Power BI/Microsoft
- ✅ Solo funciona en desarrollo (`import.meta.env.DEV`)
- ✅ No afecta errores reales de tu aplicación
- ✅ Se activa automáticamente al iniciar la app

### 2. **Atributos Mejorados en iframe**
Se agregaron atributos al iframe en `ResumenSub.vue`:
- `loading="lazy"` - Carga diferida
- `referrerpolicy="no-referrer-when-downgrade"` - Mejor privacidad
- `sandbox="allow-same-origin allow-scripts allow-popups allow-forms"` - Seguridad

## 🎯 ¿Debo Preocuparme?

### ❌ NO te preocupes si:
- Los errores son solo de `dc.services.visualstudio.com`
- Los errores son sobre cookies de Power BI
- El iframe de Power BI se muestra correctamente
- Tu aplicación funciona normalmente

### ⚠️ SÍ debes revisar si:
- Los errores son de tu propio backend (`localhost:3001`)
- Los errores impiden que Power BI se muestre
- Hay errores de JavaScript en tu código

## 🔧 Configuración

### Desactivar Filtro (si quieres ver todos los errores)
Comenta la línea en `main.ts`:
```typescript
// import './utils/consoleFilter'
```

### Agregar Más Patrones de Filtrado
Edita `src/utils/consoleFilter.ts` y agrega a `filteredPatterns`:
```typescript
const filteredPatterns = [
  'dc.services.visualstudio.com',
  'tu-nuevo-patron-aqui',
  // ...
];
```

## 📝 Notas Importantes

### 🔴 **IMPORTANTE: Sobre Producción**

**¿Los errores aparecerán en producción?**
- ✅ **SÍ**, técnicamente seguirán apareciendo en la consola del navegador
- ✅ **PERO** los usuarios finales **NO abren la consola** normalmente
- ✅ **NO afectan** la funcionalidad de la aplicación
- ✅ **NO afectan** el rendimiento
- ✅ Son **normales** cuando se embebe Power BI

**¿El filtro funciona en producción?**
- ❌ **NO** - El filtro solo está activo en desarrollo (`import.meta.env.DEV`)
- ✅ Esto es **intencional** - en producción queremos ver errores reales de nuestra app
- ✅ Los errores de Power BI son **esperados** y no son un problema

**Recomendación para Producción:**
- ✅ **No hagas nada** - está perfecto así
- ✅ Los errores son de Microsoft/Power BI, no de tu código
- ✅ No afectan la experiencia del usuario
- ✅ Si un usuario técnico abre la consola, verá los errores pero entenderá que son de Power BI

### 📊 Otras Notas

1. **Telemetría de Microsoft**: Power BI intenta enviar datos de uso a Microsoft. Esto es normal y no se puede desactivar completamente desde el iframe.

2. **Políticas de Cookies**: Los navegadores modernos bloquean cookies de terceros por defecto. Power BI está diseñado para funcionar sin estas cookies.

3. **CSP (Content Security Policy)**: Si agregas CSP headers, asegúrate de permitir:
   - `https://app.powerbi.com`
   - `https://*.powerbi.com`
   - `https://dc.services.visualstudio.com` (opcional, solo para telemetría)

## 🚀 Recomendación

**Para desarrollo**: Usa el filtro de consola (ya implementado) para mantener la consola limpia.

**Para producción**: No es necesario hacer nada. Los errores no afectan la funcionalidad y los usuarios finales no verán la consola.

---

**Última actualización**: 2025
**Estado**: ✅ Implementado y funcionando

