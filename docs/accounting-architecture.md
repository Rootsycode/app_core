# Arquitectura Contable Basada en Asientos - Rootsy

## Principio Fundamental

**Toda transacción del sistema se registra como asientos contables (débito/crédito) según el plan de cuentas argentino.**

El sistema contable es la **fuente de verdad única**. Todas las operaciones de negocio (ventas, compras, pagos, gastos, etc.) generan asientos contables que permiten:
- Trazabilidad completa
- Reportes financieros automáticos
- Cumplimiento normativo argentino
- Auditoría completa

---

## Estructura del Plan de Cuentas Argentino

### Clasificación por Rubros

```
1. ACTIVO (1.x.x)
   1.1. Activo Corriente
       1.1.1. Caja y Bancos
       1.1.2. Créditos por Ventas
       1.1.3. Bienes de Cambio (Inventario)
   1.2. Activo No Corriente
       1.2.1. Bienes de Uso
       1.2.2. Inversiones

2. PASIVO (2.x.x)
   2.1. Pasivo Corriente
       2.1.1. Deudas Comerciales
       2.1.2. Deudas Fiscales
   2.2. Pasivo No Corriente

3. PATRIMONIO NETO (3.x.x)
   3.1. Capital
   3.2. Resultados

4. INGRESOS (4.x.x)
   4.1. Ventas
   4.2. Otros Ingresos

5. COSTOS (5.x.x)
   5.1. Costo de Ventas
   5.2. Costo de Producción

6. GASTOS (6.x.x)
   6.1. Gastos de Administración
   6.2. Gastos de Comercialización
   6.3. Gastos Financieros
```

---

## Estructura de Base de Datos

### 1. Plan de Cuentas (`chart_of_accounts`)

```sql
CREATE TABLE public.chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pop_id UUID REFERENCES public.pops(id) ON DELETE CASCADE NOT NULL,
  
  -- Código jerárquico (ej: "1.1.1.01")
  code TEXT NOT NULL,
  
  -- Nombre de la cuenta
  name TEXT NOT NULL,
  
  -- Tipo de cuenta
  account_type TEXT NOT NULL CHECK (account_type IN (
    'activo_corriente',
    'activo_no_corriente',
    'pasivo_corriente',
    'pasivo_no_corriente',
    'patrimonio_neto',
    'ingresos',
    'costos',
    'gastos'
  )),
  
  -- Naturaleza (débito/crédito)
  -- Activos y Gastos: naturaleza = 'deudora' (aumentan con débitos)
  -- Pasivos, Patrimonio e Ingresos: naturaleza = 'acreedora' (aumentan con créditos)
  nature TEXT NOT NULL CHECK (nature IN ('deudora', 'acreedora')),
  
  -- Cuenta padre (para jerarquía)
  parent_id UUID REFERENCES public.chart_of_accounts(id),
  
  -- Nivel en la jerarquía (1, 2, 3, 4...)
  level INTEGER NOT NULL DEFAULT 1,
  
  -- Si es cuenta de movimiento (puede tener asientos) o solo agrupadora
  is_movement_account BOOLEAN NOT NULL DEFAULT true,
  
  -- Configuración adicional
  metadata JSONB DEFAULT '{}',
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Un código único por POP
  UNIQUE(pop_id, code)
);

-- Índices
CREATE INDEX idx_chart_of_accounts_pop ON public.chart_of_accounts(pop_id);
CREATE INDEX idx_chart_of_accounts_parent ON public.chart_of_accounts(parent_id);
CREATE INDEX idx_chart_of_accounts_code ON public.chart_of_accounts(pop_id, code);
```

### 2. Asientos Contables (`accounting_entries`)

```sql
CREATE TABLE public.accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pop_id UUID REFERENCES public.pops(id) ON DELETE CASCADE NOT NULL,
  
  -- Número de asiento (secuencial por POP)
  entry_number INTEGER NOT NULL,
  
  -- Fecha del asiento
  entry_date DATE NOT NULL,
  
  -- Tipo de operación que originó el asiento
  source_type TEXT NOT NULL, -- 'sale', 'purchase', 'payment', 'expense', 'adjustment', 'manual'
  source_id UUID, -- ID de la transacción que originó el asiento
  
  -- Concepto/Descripción del asiento
  description TEXT NOT NULL,
  
  -- Estado del asiento
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
  
  -- Usuario que creó el asiento
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Fecha de contabilización (cuando se postea)
  posted_at TIMESTAMPTZ,
  posted_by UUID REFERENCES auth.users(id),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Un número de asiento único por POP
  UNIQUE(pop_id, entry_number)
);

-- Índices
CREATE INDEX idx_accounting_entries_pop ON public.accounting_entries(pop_id);
CREATE INDEX idx_accounting_entries_date ON public.accounting_entries(pop_id, entry_date);
CREATE INDEX idx_accounting_entries_source ON public.accounting_entries(pop_id, source_type, source_id);
CREATE INDEX idx_accounting_entries_status ON public.accounting_entries(pop_id, status);
```

### 3. Líneas de Asiento (`accounting_entry_lines`)

```sql
CREATE TABLE public.accounting_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES public.accounting_entries(id) ON DELETE CASCADE NOT NULL,
  
  -- Cuenta contable
  account_id UUID REFERENCES public.chart_of_accounts(id) NOT NULL,
  
  -- Monto del débito
  debit_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Monto del crédito
  credit_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Descripción de la línea
  description TEXT,
  
  -- Orden de la línea en el asiento
  line_order INTEGER NOT NULL DEFAULT 1,
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Validación: cada línea debe tener débito O crédito, no ambos
  CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR
    (credit_amount > 0 AND debit_amount = 0)
  )
);

-- Índices
CREATE INDEX idx_entry_lines_entry ON public.accounting_entry_lines(entry_id);
CREATE INDEX idx_entry_lines_account ON public.accounting_entry_lines(account_id);
```

### 4. Función de Validación: Asientos Cuadrados

```sql
-- Función para validar que un asiento esté cuadrado (suma débitos = suma créditos)
CREATE OR REPLACE FUNCTION public.validate_entry_balanced(entry_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
AS $$
  SELECT COALESCE(SUM(debit_amount), 0) = COALESCE(SUM(credit_amount), 0)
  FROM public.accounting_entry_lines
  WHERE entry_id = validate_entry_balanced.entry_id;
$$;

-- Trigger para validar antes de postear
CREATE OR REPLACE FUNCTION public.check_entry_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'posted' AND NOT public.validate_entry_balanced(NEW.id) THEN
    RAISE EXCEPTION 'El asiento no está cuadrado. Suma de débitos debe igualar suma de créditos.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_entry_balance_trigger
  BEFORE UPDATE ON public.accounting_entries
  FOR EACH ROW
  WHEN (NEW.status = 'posted' AND OLD.status != 'posted')
  EXECUTE FUNCTION public.check_entry_balance();
```

---

## Ejemplos de Asientos Contables

### 1. Venta al Contado

**Operación:** Venta de $10,000 en efectivo

**Asiento:**
```
Débito:  1.1.1.01 Caja                    $10,000
Crédito: 4.1.1.01 Ventas                  $10,000
```

**Código:**
```javascript
async function createSaleEntry(sale) {
  const entry = await createAccountingEntry({
    pop_id: sale.pop_id,
    entry_date: sale.date,
    source_type: 'sale',
    source_id: sale.id,
    description: `Venta #${sale.number} - ${sale.customer_name || 'Cliente ocasional'}`,
    lines: [
      {
        account_code: '1.1.1.01', // Caja
        debit_amount: sale.total,
        description: 'Cobro en efectivo'
      },
      {
        account_code: '4.1.1.01', // Ventas
        credit_amount: sale.total,
        description: 'Venta de productos'
      }
    ]
  })
  
  return entry
}
```

### 2. Venta a Crédito

**Operación:** Venta de $15,000 a cuenta corriente

**Asiento:**
```
Débito:  1.1.2.01 Cuentas por Cobrar      $15,000
Crédito: 4.1.1.01 Ventas                  $15,000
```

### 3. Venta con Costo de Mercadería Vendida

**Operación:** Venta de $10,000 con costo de $6,000

**Asiento:**
```
Débito:  1.1.1.01 Caja                    $10,000
Crédito: 4.1.1.01 Ventas                  $10,000

Débito:  5.1.1.01 Costo de Ventas         $6,000
Crédito: 1.1.3.01 Mercaderías            $6,000
```

### 4. Compra a Proveedor

**Operación:** Compra de mercaderías por $8,000 a proveedor

**Asiento:**
```
Débito:  1.1.3.01 Mercaderías             $8,000
Crédito: 2.1.1.01 Proveedores             $8,000
```

### 5. Pago a Proveedor

**Operación:** Pago de $8,000 a proveedor desde caja

**Asiento:**
```
Débito:  2.1.1.01 Proveedores             $8,000
Crédito: 1.1.1.01 Caja                    $8,000
```

### 6. Gasto (Ej: Alquiler)

**Operación:** Pago de alquiler $5,000

**Asiento:**
```
Débito:  6.1.1.01 Alquileres              $5,000
Crédito: 1.1.1.01 Caja                    $5,000
```

### 7. Venta con IVA

**Operación:** Venta de $10,000 + IVA 21% = $12,100

**Asiento:**
```
Débito:  1.1.1.01 Caja                    $12,100
Crédito: 4.1.1.01 Ventas                  $10,000
Crédito: 2.1.2.01 IVA a Pagar             $2,100
```

---

## Integración con Operaciones de Negocio

### Patrón: Cada Operación Genera Asientos

```javascript
// 1. VENTA
async function createSale(saleData) {
  // Crear la venta en tabla de negocio (para UI, reportes operativos)
  const sale = await supabase.from('sales').insert(saleData).select().single()
  
  // Generar asientos contables automáticamente
  await createSaleAccountingEntries(sale)
  
  return sale
}

// 2. COMPRA
async function createPurchase(purchaseData) {
  const purchase = await supabase.from('purchases').insert(purchaseData).select().single()
  await createPurchaseAccountingEntries(purchase)
  return purchase
}

// 3. PAGO
async function createPayment(paymentData) {
  const payment = await supabase.from('payments').insert(paymentData).select().single()
  await createPaymentAccountingEntries(payment)
  return payment
}

// 4. GASTO
async function createExpense(expenseData) {
  const expense = await supabase.from('expenses').insert(expenseData).select().single()
  await createExpenseAccountingEntries(expense)
  return expense
}
```

---

## Plan de Cuentas Predefinido (Argentina)

### Cuentas Estándar por Rubro

```sql
-- Función para crear plan de cuentas base para un POP
CREATE OR REPLACE FUNCTION public.create_default_chart_of_accounts(pop_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- ACTIVO CORRIENTE
  INSERT INTO public.chart_of_accounts (pop_id, code, name, account_type, nature, level, is_movement_account)
  VALUES
    (pop_id, '1.1.1.01', 'Caja', 'activo_corriente', 'deudora', 4, true),
    (pop_id, '1.1.1.02', 'Bancos', 'activo_corriente', 'deudora', 4, true),
    (pop_id, '1.1.2.01', 'Cuentas por Cobrar', 'activo_corriente', 'deudora', 4, true),
    (pop_id, '1.1.2.02', 'Documentos por Cobrar', 'activo_corriente', 'deudora', 4, true),
    (pop_id, '1.1.3.01', 'Mercaderías', 'activo_corriente', 'deudora', 4, true),
    (pop_id, '1.1.3.02', 'Productos Terminados', 'activo_corriente', 'deudora', 4, true),
    (pop_id, '1.1.3.03', 'Materias Primas', 'activo_corriente', 'deudora', 4, true);
  
  -- PASIVO CORRIENTE
  INSERT INTO public.chart_of_accounts (pop_id, code, name, account_type, nature, level, is_movement_account)
  VALUES
    (pop_id, '2.1.1.01', 'Proveedores', 'pasivo_corriente', 'acreedora', 4, true),
    (pop_id, '2.1.1.02', 'Documentos a Pagar', 'pasivo_corriente', 'acreedora', 4, true),
    (pop_id, '2.1.2.01', 'IVA a Pagar', 'pasivo_corriente', 'acreedora', 4, true),
    (pop_id, '2.1.2.02', 'Ganancias a Pagar', 'pasivo_corriente', 'acreedora', 4, true);
  
  -- INGRESOS
  INSERT INTO public.chart_of_accounts (pop_id, code, name, account_type, nature, level, is_movement_account)
  VALUES
    (pop_id, '4.1.1.01', 'Ventas', 'ingresos', 'acreedora', 4, true),
    (pop_id, '4.1.1.02', 'Ventas de Servicios', 'ingresos', 'acreedora', 4, true),
    (pop_id, '4.2.1.01', 'Otros Ingresos', 'ingresos', 'acreedora', 4, true);
  
  -- COSTOS
  INSERT INTO public.chart_of_accounts (pop_id, code, name, account_type, nature, level, is_movement_account)
  VALUES
    (pop_id, '5.1.1.01', 'Costo de Ventas', 'costos', 'deudora', 4, true),
    (pop_id, '5.2.1.01', 'Costo de Producción', 'costos', 'deudora', 4, true);
  
  -- GASTOS
  INSERT INTO public.chart_of_accounts (pop_id, code, name, account_type, nature, level, is_movement_account)
  VALUES
    (pop_id, '6.1.1.01', 'Alquileres', 'gastos', 'deudora', 4, true),
    (pop_id, '6.1.1.02', 'Servicios Públicos', 'gastos', 'deudora', 4, true),
    (pop_id, '6.1.1.03', 'Sueldos y Jornales', 'gastos', 'deudora', 4, true),
    (pop_id, '6.2.1.01', 'Publicidad', 'gastos', 'deudora', 4, true),
    (pop_id, '6.2.1.02', 'Comisiones', 'gastos', 'deudora', 4, true),
    (pop_id, '6.3.1.01', 'Intereses', 'gastos', 'deudora', 4, true);
END;
$$;
```

---

## Reportes desde Asientos Contables

### Balance de Comprobación

```sql
-- Función para obtener balance de comprobación
CREATE OR REPLACE FUNCTION public.get_trial_balance(
  pop_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  account_code TEXT,
  account_name TEXT,
  initial_debit DECIMAL(15,2),
  initial_credit DECIMAL(15,2),
  period_debit DECIMAL(15,2),
  period_credit DECIMAL(15,2),
  final_debit DECIMAL(15,2),
  final_credit DECIMAL(15,2)
)
LANGUAGE sql
AS $$
  SELECT 
    coa.code,
    coa.name,
    -- Saldos iniciales (antes de start_date)
    COALESCE(SUM(CASE WHEN ae.entry_date < start_date THEN el.debit_amount ELSE 0 END), 0) as initial_debit,
    COALESCE(SUM(CASE WHEN ae.entry_date < start_date THEN el.credit_amount ELSE 0 END), 0) as initial_credit,
    -- Movimientos del período
    COALESCE(SUM(CASE WHEN ae.entry_date BETWEEN start_date AND end_date THEN el.debit_amount ELSE 0 END), 0) as period_debit,
    COALESCE(SUM(CASE WHEN ae.entry_date BETWEEN start_date AND end_date THEN el.credit_amount ELSE 0 END), 0) as period_credit,
    -- Saldos finales
    COALESCE(SUM(el.debit_amount), 0) as final_debit,
    COALESCE(SUM(el.credit_amount), 0) as final_credit
  FROM public.chart_of_accounts coa
  LEFT JOIN public.accounting_entry_lines el ON el.account_id = coa.id
  LEFT JOIN public.accounting_entries ae ON ae.id = el.entry_id
  WHERE coa.pop_id = get_trial_balance.pop_id
    AND ae.status = 'posted'
    AND ae.entry_date <= end_date
  GROUP BY coa.id, coa.code, coa.name
  ORDER BY coa.code;
$$;
```

### Estado de Resultados

```sql
-- Función para obtener estado de resultados
CREATE OR REPLACE FUNCTION public.get_income_statement(
  pop_id UUID,
  start_date DATE,
  end_date DATE
)
RETURNS TABLE (
  account_type TEXT,
  account_code TEXT,
  account_name TEXT,
  amount DECIMAL(15,2)
)
LANGUAGE sql
AS $$
  SELECT 
    coa.account_type,
    coa.code,
    coa.name,
    CASE 
      WHEN coa.nature = 'deudora' THEN
        COALESCE(SUM(el.debit_amount - el.credit_amount), 0)
      ELSE
        COALESCE(SUM(el.credit_amount - el.debit_amount), 0)
    END as amount
  FROM public.chart_of_accounts coa
  LEFT JOIN public.accounting_entry_lines el ON el.account_id = coa.id
  LEFT JOIN public.accounting_entries ae ON ae.id = el.entry_id
  WHERE coa.pop_id = get_income_statement.pop_id
    AND ae.status = 'posted'
    AND ae.entry_date BETWEEN start_date AND end_date
    AND coa.account_type IN ('ingresos', 'costos', 'gastos')
  GROUP BY coa.id, coa.account_type, coa.code, coa.name, coa.nature
  ORDER BY coa.account_type, coa.code;
$$;
```

---

## Flujo de Trabajo

### 1. Crear Asiento

```javascript
async function createAccountingEntry(data) {
  const { pop_id, entry_date, source_type, source_id, description, lines } = data
  
  // 1. Obtener próximo número de asiento
  const nextNumber = await getNextEntryNumber(pop_id)
  
  // 2. Crear asiento (status: 'draft')
  const entry = await supabase
    .from('accounting_entries')
    .insert({
      pop_id,
      entry_number: nextNumber,
      entry_date,
      source_type,
      source_id,
      description,
      status: 'draft',
      created_by: userId
    })
    .select()
    .single()
  
  // 3. Crear líneas del asiento
  for (const line of lines) {
    const account = await getAccountByCode(pop_id, line.account_code)
    
    await supabase.from('accounting_entry_lines').insert({
      entry_id: entry.id,
      account_id: account.id,
      debit_amount: line.debit_amount || 0,
      credit_amount: line.credit_amount || 0,
      description: line.description,
      line_order: line.order || 1
    })
  }
  
  // 4. Validar que esté cuadrado
  const isBalanced = await validateEntryBalance(entry.id)
  if (!isBalanced) {
    throw new Error('El asiento no está cuadrado')
  }
  
  // 5. Postear automáticamente (o manualmente según configuración)
  await postEntry(entry.id, userId)
  
  return entry
}
```

### 2. Postear Asiento

```javascript
async function postEntry(entryId, userId) {
  // Validar balance
  const isBalanced = await validateEntryBalance(entryId)
  if (!isBalanced) {
    throw new Error('No se puede postear un asiento desbalanceado')
  }
  
  // Cambiar status a 'posted'
  await supabase
    .from('accounting_entries')
    .update({
      status: 'posted',
      posted_at: new Date().toISOString(),
      posted_by: userId
    })
    .eq('id', entryId)
}
```

---

## Ventajas de esta Arquitectura

1. **Trazabilidad Completa**: Cada operación tiene su asiento contable
2. **Reportes Automáticos**: Balance, Estado de Resultados, etc. desde los asientos
3. **Cumplimiento Normativo**: Cumple con normativa contable argentina
4. **Auditoría**: Historial completo de todas las operaciones
5. **Flexibilidad**: Permite asientos manuales y ajustes
6. **Integridad**: Validación automática de asientos cuadrados

---

## Próximos Pasos

1. Crear migración para tablas contables
2. Implementar funciones de creación de asientos automáticos
3. Crear plan de cuentas base para cada POP
4. Implementar reportes contables
5. Integrar con operaciones de negocio (ventas, compras, etc.)

