# Estrategia de Almacenamiento: SQL vs Key-Value Store (KVS)

## Principio General

**SQL para datos estructurados que requieren relaciones y queries complejas.**
**KVS para datos simples, cache, y acceso rápido por clave.**

---

## 📊 **USAR SQL (PostgreSQL/Supabase)**

### 1. **Datos Transaccionales y de Negocio**
Estos datos **SIEMPRE** deben estar en SQL porque:
- Requieren relaciones (JOINs)
- Necesitan queries complejas con filtros, agrupaciones, ordenamiento
- Requieren integridad referencial (foreign keys)
- Necesitan transacciones ACID
- Son la fuente de verdad para reportes y estadísticas

#### ✅ **Tablas Core (Ya implementadas)**
- `users` - Datos de usuarios
- `pops` - Puntos de venta
- `roles`, `permissions`, `role_permissions` - Sistema de permisos
- `user_pop_roles` - Relaciones usuario-POP-rol
- `subscription_plans`, `business_types`, `pop_subscriptions` - Suscripciones

#### ✅ **Tablas de Negocio (A implementar)**
- `products` - Productos con SKU, precios, categorías, stock
- `sales` - Ventas con totales, fechas, usuarios, métodos de pago
- `sale_items` - Items de cada venta (relación con products)
- `customers` - Clientes con historial de compras
- `suppliers` - Proveedores
- `inventory` - Movimientos de inventario
- `purchases` - Compras a proveedores
- `invoices` - Facturas (relación con sales)
- `payments` - Pagos y cuentas corrientes
- `orders` - Pedidos (mesas, delivery, etc.)
- `tables` - Mesas (para restaurantes)
- `recipes` - Recetas (para fabricación)

**¿Por qué SQL?**
```sql
-- Ejemplo: Estadísticas de ventas por cliente en un rango de fechas
SELECT 
  c.name,
  COUNT(s.id) as total_ventas,
  SUM(s.total) as total_monto,
  AVG(s.total) as promedio_venta
FROM customers c
JOIN sales s ON s.customer_id = c.id
WHERE s.pop_id = $1
  AND s.created_at BETWEEN $2 AND $3
  AND s.status = 'completed'
GROUP BY c.id, c.name
ORDER BY total_monto DESC;
```

---

### 2. **Datos que Requieren Filtrado Complejo**
- Búsquedas con múltiples criterios
- Agrupaciones y agregaciones
- Ordenamiento dinámico
- Paginación eficiente
- Relaciones entre entidades

**Ejemplos:**
- "Productos con stock bajo, de categoría X, creados en los últimos 30 días"
- "Ventas por vendedor, agrupadas por mes, con totales"
- "Clientes que compraron más de $X en el último año"

---

### 3. **Datos con Relaciones Complejas**
- Foreign keys
- Relaciones many-to-many
- Integridad referencial
- Cascading deletes/updates

**Ejemplos:**
- `sale_items` → `sales` → `customers` → `pops`
- `products` → `categories` → `suppliers`
- `orders` → `tables` → `pops`

---

## 🚀 **USAR KVS (Redis, Upstash, etc.)**

### 1. **Cache de Queries Pesadas**
Cachear resultados de queries SQL complejas que se consultan frecuentemente.

**Ejemplos:**
```javascript
// Cache de estadísticas del día (se actualiza cada hora)
key: `pop:${popId}:stats:today`
value: { totalSales: 15000, totalOrders: 45, avgTicket: 333.33 }
TTL: 3600 segundos

// Cache de productos más vendidos
key: `pop:${popId}:top-products:week`
value: [{ productId, name, salesCount, revenue }]
TTL: 86400 segundos (24 horas)
```

**Ventajas:**
- Respuesta instantánea para dashboards
- Reduce carga en PostgreSQL
- Se invalida cuando hay cambios relevantes

---

### 2. **Sesiones y Estado Temporal**
- Sesiones de usuario
- Carritos de compra temporales
- Estados de procesos en curso
- Locks y mutexes

**Ejemplos:**
```javascript
// Carrito de compra activo
key: `cart:${userId}:${popId}`
value: { items: [...], total: 1500, expiresAt: '2024-01-15T10:30:00Z' }
TTL: 3600 segundos (1 hora)

// Sesión de punto de venta activo
key: `pos-session:${userId}:${popId}`
value: { currentSale: {...}, cashRegister: 'register-1' }
TTL: 28800 segundos (8 horas)
```

---

### 3. **Configuraciones y Settings Simples**
Para configuraciones que:
- No requieren queries complejas
- Se acceden por clave única
- Cambian poco frecuentemente
- No tienen relaciones complejas

**Ejemplos:**
```javascript
// Configuración de impresora
key: `pop:${popId}:printer:${printerId}`
value: { name: 'Impresora 1', type: 'thermal', settings: {...} }

// Preferencias de usuario (no críticas)
key: `user:${userId}:preferences`
value: { theme: 'dark', language: 'es', notifications: {...} }
```

**⚠️ NOTA:** Si las configuraciones necesitan:
- Búsquedas por múltiples campos
- Relaciones con otras entidades
- Historial de cambios
- Auditoría

→ **Usar SQL** con tabla `pop_settings` o similar.

---

### 4. **Contadores y Métricas en Tiempo Real**
- Contadores de visitas
- Métricas de performance
- Rate limiting
- Contadores de stock (temporal, se sincroniza con SQL)

**Ejemplos:**
```javascript
// Contador de productos vendidos hoy (se resetea a medianoche)
key: `pop:${popId}:metrics:sales:today`
value: 45
TTL: hasta medianoche

// Rate limiting por usuario
key: `rate-limit:${userId}:api-calls`
value: 150
TTL: 3600 segundos
```

---

### 5. **Datos de Tiempo Real (Pub/Sub)**
- Notificaciones en tiempo real
- Estado de conexión de usuarios
- Colas de mensajes temporales

---

## 🔄 **ENFOQUE HÍBRIDO (Recomendado)**

### Patrón: **SQL como Fuente de Verdad + KVS como Cache**

```javascript
// 1. Leer desde cache primero
async function getTopProducts(popId, period = 'week') {
  const cacheKey = `pop:${popId}:top-products:${period}`
  
  // Intentar cache
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  // Si no hay cache, consultar SQL
  const products = await supabase
    .from('products')
    .select('*, sales_count:count(sale_items.id)')
    .eq('pop_id', popId)
    .gte('created_at', getPeriodStart(period))
    .order('sales_count', { ascending: false })
    .limit(10)
  
  // Guardar en cache
  await redis.setex(cacheKey, 3600, JSON.stringify(products))
  
  return products
}

// 2. Invalidar cache cuando hay cambios
async function createSale(saleData) {
  // Crear venta en SQL
  const sale = await supabase.from('sales').insert(saleData)
  
  // Invalidar caches relacionados
  await redis.del(`pop:${sale.pop_id}:stats:today`)
  await redis.del(`pop:${sale.pop_id}:top-products:week`)
  await redis.del(`pop:${sale.pop_id}:revenue:month`)
  
  return sale
}
```

---

## 📋 **DECISIÓN POR CASO DE USO**

### ✅ **SQL (PostgreSQL)**
| Caso de Uso | Razón |
|------------|-------|
| Productos | Búsquedas, filtros, categorías, relaciones con ventas |
| Ventas | Queries complejas, estadísticas, reportes, relaciones |
| Clientes | Historial, búsquedas, relaciones con ventas |
| Inventario | Movimientos, stock actual, historial, auditoría |
| Facturas | Relaciones, numeración, búsquedas complejas |
| Reportes | Agregaciones, agrupaciones, filtros múltiples |
| Permisos | Relaciones complejas, queries de acceso |
| Suscripciones | Relaciones, cálculos, historial |

### 🚀 **KVS (Redis/Upstash)**
| Caso de Uso | Razón |
|------------|-------|
| Cache de estadísticas | Performance, queries pesadas frecuentes |
| Carritos de compra | Temporales, acceso rápido por clave |
| Sesiones POS | Estado temporal, no requiere queries |
| Contadores en tiempo real | Incrementos rápidos, TTL automático |
| Rate limiting | Control de acceso, expiración automática |
| Configuraciones simples | Acceso por clave, sin relaciones |
| Cache de productos populares | Performance, invalidation controlada |

### ⚠️ **NO USAR KVS PARA:**
- ❌ Datos que requieren JOINs
- ❌ Datos que necesitan filtrado complejo
- ❌ Datos que son fuente de verdad para reportes
- ❌ Datos con relaciones críticas
- ❌ Datos que requieren transacciones ACID
- ❌ Datos que necesitan auditoría completa

---

## 🎯 **RECOMENDACIÓN FINAL**

### Arquitectura Propuesta:

1. **SQL (PostgreSQL/Supabase)** - Fuente de verdad
   - Todas las tablas de negocio (products, sales, customers, etc.)
   - Todas las relaciones y foreign keys
   - Todas las queries complejas y reportes

2. **KVS (Redis/Upstash)** - Capa de performance
   - Cache de queries pesadas
   - Estado temporal (carritos, sesiones)
   - Contadores y métricas en tiempo real
   - Rate limiting

3. **Invalidación Inteligente**
   - Cuando se crea/actualiza/elimina en SQL → invalidar caches relacionados
   - TTL automático para datos temporales
   - Cache warming para datos críticos

### Ejemplo Práctico:

```javascript
// Dashboard de ventas
async function getSalesDashboard(popId) {
  // 1. Cache de estadísticas del día
  const todayStats = await redis.get(`pop:${popId}:stats:today`)
  if (todayStats) return JSON.parse(todayStats)
  
  // 2. Si no hay cache, calcular desde SQL
  const stats = await supabase.rpc('get_sales_stats', {
    pop_id: popId,
    start_date: startOfDay(),
    end_date: endOfDay()
  })
  
  // 3. Guardar en cache (1 hora)
  await redis.setex(`pop:${popId}:stats:today`, 3600, JSON.stringify(stats))
  
  return stats
}

// Cuando se crea una venta
async function createSale(saleData) {
  // 1. Crear en SQL (fuente de verdad)
  const sale = await supabase.from('sales').insert(saleData).select().single()
  
  // 2. Invalidar caches
  await Promise.all([
    redis.del(`pop:${sale.pop_id}:stats:today`),
    redis.del(`pop:${sale.pop_id}:stats:week`),
    redis.del(`pop:${sale.pop_id}:top-products:week`)
  ])
  
  return sale
}
```

---

## 📊 **MÉTRICAS DE PERFORMANCE**

### SQL para:
- ✅ Queries complejas: 50-200ms (aceptable)
- ✅ Reportes: 200-1000ms (aceptable con paginación)
- ✅ Búsquedas con índices: 10-50ms (excelente)

### KVS para:
- ✅ Cache hits: <5ms (excelente)
- ✅ Escrituras simples: <10ms (excelente)
- ✅ Contadores: <5ms (excelente)

---

## 🔍 **CUANDO DUDAR**

Si un dato necesita:
- ✅ Búsquedas por múltiples campos → **SQL**
- ✅ Relaciones con otras entidades → **SQL**
- ✅ Filtrado complejo → **SQL**
- ✅ Agregaciones y reportes → **SQL**
- ✅ Solo acceso por clave única → **KVS**
- ✅ Datos temporales con TTL → **KVS**
- ✅ Cache de resultados SQL → **KVS**

---

## 🎓 **RESUMEN**

**SQL = Estructura, relaciones, queries complejas, fuente de verdad**
**KVS = Performance, cache, estado temporal, acceso rápido**

**Híbrido = SQL para datos + KVS para cache = Lo mejor de ambos mundos**

