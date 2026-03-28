# Estrategia de Suscripciones y Multi-Tenancy para Rootsy

## Resumen Ejecutivo

Rootsy es un sistema multi-tenant donde:
- Cada usuario puede crear **1 solo POP** con prueba gratis de 7 días
- Cada POP tiene un **owner** (el usuario que lo creó)
- Los POPs pueden ser configurados para diferentes tipos de negocios
- Sistema de suscripciones flexible con diferentes planes y precios

## Modelo de Negocio

### 1. Límite de POPs por Usuario
- **1 POP por usuario** (el que crea es el owner)
- **Prueba gratis de 7 días** desde la creación del POP
- Después de la prueba, requiere suscripción activa para continuar operando

### 2. Tipos de Negocio
Los POPs pueden configurarse para diferentes tipos de negocios, cada uno con características específicas:

- **Comercios** (retail): Productos físicos, inventario, ventas al por menor
- **Bares/Restaurantes**: Mesas, comandas, menús, turnos
- **Fábricas**: Producción, materias primas, control de calidad
- **Servicios**: Citas, profesionales, servicios por hora
- **Centros Deportivos**: Membresías, clases, instalaciones

### 3. Sistema de Suscripciones

#### Enfoque Propuesto: **Planes Base + Add-ons por Tipo de Negocio**

**Ventajas:**
- Flexibilidad para diferentes tipos de negocio
- Escalabilidad de precios según necesidades
- Fácil agregar nuevos tipos de negocio sin cambiar estructura
- Permite promociones y descuentos por tipo

**Estructura:**
1. **Planes Base** (nivel de servicio):
   - `free_trial`: Prueba gratis (7 días)
   - `starter`: Funcionalidades básicas
   - `professional`: Funcionalidades avanzadas
   - `enterprise`: Funcionalidades completas + soporte prioritario

2. **Add-ons por Tipo de Negocio**:
   - Módulos específicos según el tipo (ej: módulo de mesas para bares)
   - Features adicionales (ej: múltiples ubicaciones, reportes avanzados)
   - Límites configurables (ej: número de usuarios, productos, ventas/mes)

3. **Precios Dinámicos**:
   - Precio base del plan
   + Precio del add-on del tipo de negocio
   + Precio de features adicionales
   = **Precio total mensual/anual**

#### Alternativa: **Planes Predefinidos por Tipo de Negocio**

**Ventajas:**
- Más simple de entender para el usuario
- Precios fijos y predecibles
- Fácil de mostrar en landing page

**Desventajas:**
- Menos flexible
- Más difícil agregar nuevos tipos
- Puede generar planes "huérfanos" si un tipo no es popular

**Recomendación:** Usar **Planes Base + Add-ons** para máxima flexibilidad.

## Estructura de Base de Datos

### Tablas Nuevas

#### 1. `subscription_plans` - Planes de Suscripción Base
```sql
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- 'free_trial', 'starter', 'professional', 'enterprise'
  display_name TEXT NOT NULL,
  description TEXT,
  base_price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  base_price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  trial_days INTEGER DEFAULT 0,
  features JSONB DEFAULT '{}', -- Lista de features incluidas
  limits JSONB DEFAULT '{}', -- Límites del plan (ej: max_users, max_products)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. `business_types` - Tipos de Negocio
```sql
CREATE TABLE public.business_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL, -- 'retail', 'restaurant', 'factory', 'service', 'gym'
  display_name TEXT NOT NULL,
  description TEXT,
  addon_price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  addon_price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  modules JSONB DEFAULT '[]', -- Módulos específicos del tipo
  features JSONB DEFAULT '{}', -- Features específicas del tipo
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. `pop_subscriptions` - Suscripciones Activas de POPs
```sql
CREATE TABLE public.pop_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pop_id UUID REFERENCES public.pops(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id UUID REFERENCES public.subscription_plans(id) NOT NULL,
  business_type_id UUID REFERENCES public.business_types(id) NOT NULL,
  
  -- Estado de la suscripción
  status TEXT NOT NULL DEFAULT 'trial', -- 'trial', 'active', 'past_due', 'canceled', 'expired'
  billing_cycle TEXT NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
  
  -- Fechas importantes
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  canceled_at TIMESTAMPTZ,
  
  -- Precios
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Integración con Stripe (o otro payment provider)
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 4. Modificar tabla `pops`
```sql
ALTER TABLE public.pops
  ADD COLUMN business_type_id UUID REFERENCES public.business_types(id),
  ADD COLUMN subscription_id UUID REFERENCES public.pop_subscriptions(id),
  ADD COLUMN settings JSONB DEFAULT '{}'; -- Configuraciones específicas del tipo de negocio
```

#### 5. `subscription_features` - Features Adicionales (Opcional)
```sql
CREATE TABLE public.subscription_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 6. `pop_subscription_features` - Features Adicionales Activas
```sql
CREATE TABLE public.pop_subscription_features (
  subscription_id UUID REFERENCES public.pop_subscriptions(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES public.subscription_features(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (subscription_id, feature_id)
);
```

## Flujo de Creación de POP

1. Usuario crea un POP
   - Verificar que no tenga otro POP activo (excepto si está en trial)
   - Asignar tipo de negocio
   - Crear suscripción con status `trial`
   - `trial_started_at` = now()
   - `trial_ends_at` = now() + 7 days
   - `current_period_start` = now()
   - `current_period_end` = now() + 7 days

2. Durante el trial (7 días)
   - POP funciona normalmente
   - Mostrar banner de "X días restantes de prueba"
   - Permitir actualizar a plan de pago en cualquier momento

3. Fin del trial
   - Si no hay suscripción activa: `status` = 'expired', `is_active` = false en POP
   - Bloquear acceso (mostrar pantalla de upgrade)
   - Permitir reactivar con suscripción

4. Suscripción activa
   - `status` = 'active'
   - Renovación automática según `billing_cycle`
   - Webhooks de Stripe para actualizar estado

## Validaciones y Restricciones

### Función: Verificar si usuario puede crear POP
```sql
CREATE OR REPLACE FUNCTION public.can_user_create_pop(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_pop_count INTEGER;
  has_active_trial BOOLEAN;
BEGIN
  -- Contar POPs donde el usuario es owner
  SELECT COUNT(*) INTO existing_pop_count
  FROM public.pops
  WHERE owner_user_id = can_user_create_pop.user_id;
  
  -- Si no tiene POPs, puede crear uno
  IF existing_pop_count = 0 THEN
    RETURN TRUE;
  END IF;
  
  -- Si tiene 1 POP, verificar si está en trial
  IF existing_pop_count = 1 THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.pops p
      JOIN public.pop_subscriptions ps ON ps.pop_id = p.id
      WHERE p.owner_user_id = can_user_create_pop.user_id
        AND ps.status = 'trial'
        AND ps.trial_ends_at > now()
    ) INTO has_active_trial;
    
    -- Si tiene trial activo, puede crear (reemplazar)
    IF has_active_trial THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- En cualquier otro caso, no puede crear
  RETURN FALSE;
END;
$$;
```

### Trigger: Auto-crear suscripción trial al crear POP
```sql
CREATE OR REPLACE FUNCTION public.create_trial_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trial_plan_id UUID;
  default_business_type_id UUID;
  subscription_id UUID;
BEGIN
  -- Obtener plan de trial
  SELECT id INTO trial_plan_id
  FROM public.subscription_plans
  WHERE name = 'free_trial'
  LIMIT 1;
  
  -- Obtener tipo de negocio por defecto (o el que se pase)
  SELECT id INTO default_business_type_id
  FROM public.business_types
  WHERE name = COALESCE(NEW.business_type_id::TEXT, 'retail')
  LIMIT 1;
  
  -- Si no hay tipo, usar el primero disponible
  IF default_business_type_id IS NULL THEN
    SELECT id INTO default_business_type_id
    FROM public.business_types
    WHERE is_active = true
    ORDER BY created_at
    LIMIT 1;
  END IF;
  
  -- Crear suscripción trial
  INSERT INTO public.pop_subscriptions (
    pop_id,
    plan_id,
    business_type_id,
    status,
    trial_started_at,
    trial_ends_at,
    current_period_start,
    current_period_end,
    price_monthly,
    price_yearly
  ) VALUES (
    NEW.id,
    trial_plan_id,
    default_business_type_id,
    'trial',
    now(),
    now() + INTERVAL '7 days',
    now(),
    now() + INTERVAL '7 days',
    0,
    0
  ) RETURNING id INTO subscription_id;
  
  -- Actualizar POP con subscription_id
  NEW.subscription_id = subscription_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_pop_created_create_trial
  AFTER INSERT ON public.pops
  FOR EACH ROW
  EXECUTE FUNCTION public.create_trial_subscription();
```

## Integración con Stripe

### Webhooks Necesarios

1. `customer.subscription.created` - Suscripción creada
2. `customer.subscription.updated` - Suscripción actualizada
3. `customer.subscription.deleted` - Suscripción cancelada
4. `invoice.payment_succeeded` - Pago exitoso
5. `invoice.payment_failed` - Pago fallido

### Flujo de Checkout

1. Usuario selecciona plan y tipo de negocio
2. Crear/actualizar `stripe_customer_id` en `pop_subscriptions`
3. Crear checkout session en Stripe
4. Redirigir a Stripe Checkout
5. Webhook actualiza `pop_subscriptions` cuando se completa

## Funciones Helper

### Verificar si POP está activo (trial o suscripción activa)
```sql
CREATE OR REPLACE FUNCTION public.is_pop_active(pop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pops p
    JOIN public.pop_subscriptions ps ON ps.pop_id = p.id
    WHERE p.id = is_pop_active.pop_id
      AND p.is_active = true
      AND ps.status IN ('trial', 'active')
      AND (
        ps.status = 'trial' AND ps.trial_ends_at > now()
        OR ps.status = 'active' AND ps.current_period_end > now()
      )
  );
$$;
```

### Obtener días restantes de trial
```sql
CREATE OR REPLACE FUNCTION public.get_trial_days_remaining(pop_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT GREATEST(0, EXTRACT(DAY FROM (ps.trial_ends_at - now()))::INTEGER)
  FROM public.pop_subscriptions ps
  WHERE ps.pop_id = get_trial_days_remaining.pop_id
    AND ps.status = 'trial'
    AND ps.trial_ends_at > now()
  LIMIT 1;
$$;
```

## Consideraciones de Implementación

### 1. Middleware de Validación
- Antes de cada operación en un POP, verificar `is_pop_active(pop_id)`
- Si no está activo, redirigir a página de upgrade

### 2. Notificaciones
- Email 3 días antes de que termine el trial
- Email 1 día antes
- Email cuando termina el trial
- Email cuando falla un pago

### 3. Límites por Plan
- Validar límites antes de crear recursos (ej: productos, usuarios)
- Mostrar advertencias cuando se acerca al límite

### 4. Migración de Datos Existentes
- POPs existentes sin suscripción → Crear trial de 7 días
- POPs existentes con owner → Asignar como owner

## Precios Sugeridos (Ejemplo)

### Planes Base
- **Free Trial**: $0 (7 días)
- **Starter**: $29/mes o $290/año (10% descuento)
- **Professional**: $79/mes o $790/año (10% descuento)
- **Enterprise**: $199/mes o $1990/año (10% descuento)

### Add-ons por Tipo de Negocio
- **Retail**: +$0 (incluido en base)
- **Restaurant**: +$20/mes
- **Factory**: +$30/mes
- **Service**: +$15/mes
- **Gym**: +$25/mes

### Features Adicionales
- Múltiples ubicaciones: +$10/mes por ubicación adicional
- Reportes avanzados: +$15/mes
- API access: +$20/mes
- Soporte prioritario: +$30/mes

## Próximos Pasos

1. ✅ Crear migraciones de base de datos
2. ⏳ Implementar funciones helper
3. ⏳ Crear triggers automáticos
4. ⏳ Integrar Stripe
5. ⏳ Crear UI de selección de plan/tipo
6. ⏳ Implementar middleware de validación
7. ⏳ Crear webhooks de Stripe
8. ⏳ Sistema de notificaciones

