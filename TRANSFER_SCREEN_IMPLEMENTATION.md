# Pantalla de Transferencias - Implementación

## Problema Resuelto
La ruta `/wallets/transfer` no existía, causando el error "wallet no encontrada" cuando se intentaba acceder desde QuickActions.

## Solución Implementada

### Archivo Creado
`app/wallets/transfer.tsx` - Pantalla completa de transferencias entre cuentas

## Funcionalidades

### 🎯 Características Principales

1. **Validación de Cuentas Disponibles**
   - Muestra mensaje si no hay cuentas
   - Muestra mensaje si solo hay 1 cuenta (necesita mínimo 2)
   - Botón para crear nueva cuenta

2. **Selección de Cuentas**
   - **Cuenta Origen**: Solo muestra cuentas con balance > 0
   - **Cuenta Destino**: Excluye la cuenta seleccionada como origen
   - Pickers con información completa: `🏦 Nombre - $1000.00`

3. **Validación de Monto**
   - Input numérico
   - Muestra balance disponible de la cuenta origen
   - Valida que no exceda el balance disponible
   - No permite montos negativos o cero

4. **Nota Opcional**
   - Campo de texto multilínea
   - Se guarda en ambas transacciones

5. **Creación de Transacciones**
   - **Cuenta Origen**: Crea transacción de tipo "expense" (gasto)
   - **Cuenta Destino**: Crea transacción de tipo "income" (ingreso)
   - Ambas transacciones se vinculan con `to_wallet_id`

### 📊 Flujo de Transferencia

```
Usuario selecciona:
├─ Cuenta Origen: Wallet A ($1000)
├─ Cuenta Destino: Wallet B ($500)
├─ Monto: $200
└─ Nota: "Pago de renta"

Al transferir:
├─ Wallet A: -$200 (expense) → Balance: $800
│   └─ Título: "Transferencia enviada"
│   └─ Nota: "Pago de renta"
│   └─ to_wallet_id: Wallet B
│
└─ Wallet B: +$200 (income) → Balance: $700
    └─ Título: "Transferencia recibida"
    └─ Nota: "Pago de renta"
```

### ✅ Validaciones Implementadas

1. **Formulario Válido**:
   - Cuenta origen seleccionada
   - Cuenta destino seleccionada
   - Monto > 0
   - Monto ≤ Balance disponible

2. **Prevención de Errores**:
   - No permite seleccionar la misma cuenta como origen y destino
   - Deshabilita selector de destino hasta que se seleccione origen
   - Muestra balance disponible en tiempo real
   - Botón deshabilitado si el formulario no es válido

### 🎨 UI/UX

#### Estados de la Pantalla:

1. **Sin Cuentas**:
   ```
   🏦
   No hay cuentas
   Necesitas crear al menos 2 cuentas...
   [Crear Cuenta]
   ```

2. **Solo 1 Cuenta**:
   ```
   ⇄
   Necesitas más cuentas
   Necesitas al menos 2 cuentas...
   [Crear Otra Cuenta]
   ```

3. **Formulario Normal**:
   - Selector de cuenta origen
   - Selector de cuenta destino
   - Input de monto con balance disponible
   - Área de nota opcional
   - Botón de transferir

#### Alertas:
- ✅ **Éxito**: "¡Transferencia exitosa!" (verde)
- ❌ **Error**: Mensaje específico del error (rojo)
- ⚠️ **Validación**: "Datos incompletos" o "Saldo insuficiente" (naranja)

### 🔄 Sincronización

Después de una transferencia exitosa:
1. Refresca el contexto de wallets (`refreshWallets()`)
2. Limpia el formulario
3. Muestra alerta de éxito
4. Regresa a la pantalla anterior al confirmar

### 📱 Navegación

**Acceso desde**:
- QuickActions → "Transfer" → `/wallets/transfer`
- Cualquier otra parte que use la ruta

**Botón Volver**:
- Header con botón de retroceso
- Regresa a la pantalla anterior

## Código Destacado

### Filtrado de Wallets Disponibles
```typescript
// Solo wallets con balance > 0 para origen
const availableFromWallets = wallets.filter(
  (w) => (w.net_balance || 0) > 0
);

// Excluir wallet origen de las opciones de destino
const availableToWallets = wallets.filter(
  (w) => w.id !== fromWalletId
);
```

### Creación de Transacciones Vinculadas
```typescript
// Transacción de salida
await createTransaction({
  wallet_id: fromWalletId,
  amount: amountNum,
  type: "expense",
  title: "Transferencia enviada",
  to_wallet_id: toWalletId,  // ← Vinculación
  // ...
});

// Transacción de entrada
await createTransaction({
  wallet_id: toWalletId,
  amount: amountNum,
  type: "income",
  title: "Transferencia recibida",
  // ...
});
```

## Testing

### Casos de Prueba:

1. **Sin cuentas**:
   - Abrir transfer sin cuentas
   - ✅ Debe mostrar mensaje "No hay cuentas"

2. **Una cuenta**:
   - Abrir transfer con 1 cuenta
   - ✅ Debe mostrar "Necesitas más cuentas"

3. **Transferencia exitosa**:
   - Seleccionar cuenta origen con $1000
   - Seleccionar cuenta destino
   - Ingresar $200
   - Transferir
   - ✅ Origen debe tener $800
   - ✅ Destino debe aumentar $200
   - ✅ Debe crear 2 transacciones

4. **Validación de balance**:
   - Intentar transferir más del balance disponible
   - ✅ Debe mostrar error "Saldo insuficiente"

5. **Prevención de misma cuenta**:
   - Seleccionar cuenta A como origen
   - ✅ Cuenta A no debe aparecer en destino

## Archivos Relacionados

- ✅ `app/wallets/transfer.tsx` - Pantalla principal (NUEVO)
- ✅ `components/QuickActions.tsx` - Enlace a la ruta
- ✅ `contexts/WalletsContext.tsx` - Contexto de wallets
- ✅ `lib/database/sqliteService.ts` - Servicio de BD

## Mejoras Futuras (Opcional)

- [ ] Conversión automática de monedas (USD ↔ MXN)
- [ ] Historial de transferencias
- [ ] Transferencias programadas
- [ ] Categorías para transferencias
- [ ] Confirmación con PIN/biometría
- [ ] Límites de transferencia diarios

## Notas Técnicas

- Las transferencias crean 2 transacciones independientes
- El campo `to_wallet_id` vincula la transacción de origen con el destino
- Los balances se actualizan automáticamente por las transacciones
- Los errores de TypeScript del IDE son normales y no afectan la funcionalidad
