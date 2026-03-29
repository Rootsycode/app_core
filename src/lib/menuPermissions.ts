export function getMenuResourceAction (
  menuLabel: string,
  _menuLink?: string
): {
  resource: string
  action: string
} | null {
  const menuPermissionMap: Record<string, { resource: string; action: string }> =
    {
      Mesas: { resource: 'tables', action: 'view' },
      Mostrador: { resource: 'counter', action: 'view' },
      Vender: { resource: 'sales', action: 'create' },
      Comprar: { resource: 'purchases', action: 'view' },
      Fabricación: { resource: 'manufacturing', action: 'view' },
      Inventario: { resource: 'inventory', action: 'view' },
      Clientes: { resource: 'customers', action: 'view' },
      Proveedores: { resource: 'suppliers', action: 'view' },
      'Cuentas Corrientes': { resource: 'accounts_receivable', action: 'view' },
      Promociones: { resource: 'promotions', action: 'view' },
      Recetas: { resource: 'recipes', action: 'view' },
      Pedidos: { resource: 'orders', action: 'view' },
      Presupuestos: { resource: 'quotes', action: 'view' },
      Resumen: { resource: 'summary', action: 'view' },
      Estadísticas: { resource: 'statistics', action: 'view' },
      Operaciones: { resource: 'operations', action: 'view' },
      Movimientos: { resource: 'movements', action: 'view' },
      Gastos: { resource: 'expenses', action: 'view' },
      Facturas: { resource: 'invoices', action: 'view' },
      Reportes: { resource: 'reports', action: 'view' },
      Cheques: { resource: 'checks', action: 'view' },
      'Órdenes de Compra': { resource: 'purchase_orders', action: 'view' },
      Mensajes: { resource: 'messages', action: 'view' },
      Alertas: { resource: 'alerts', action: 'view' },
      'Formas de Pago': { resource: 'payment_methods', action: 'view' },
      Cajas: { resource: 'cash_registers', action: 'view' },
      Cuentas: { resource: 'accounts', action: 'view' },
      RRHH: { resource: 'hr', action: 'view' },
      Impresoras: { resource: 'printers', action: 'view' },
      Ajustes: { resource: 'settings', action: 'read' }
    }

  return menuPermissionMap[menuLabel] || null
}
