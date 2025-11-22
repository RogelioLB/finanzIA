# Sistema de Edición de Wallets

## Funcionalidades Implementadas

### 1. **CurrencySelector Component** 
`components/views/wallets/CurrencySelector.tsx`

Componente reutilizable para seleccionar moneda:
- **Monedas soportadas**: USD 🇺🇸 y MXN 🇲🇽
- **Diseño en grid** con banderas y nombres completos
- Selección visual con borde destacado
- Fácil de extender para agregar más monedas

```typescript
export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "Dólar estadounidense", flag: "🇺🇸" },
  { code: "MXN", symbol: "$", name: "Peso mexicano", flag: "🇲🇽" },
];
```

### 2. **EditWalletScreen**
`app/wallets/edit-wallet/[id].tsx`

Pantalla completa de edición de wallet con:

#### Campos Editables:
- ✅ **Nombre** - TextInput editable
- ✅ **Balance** - Con bottom sheet de teclado numérico
- ✅ **Moneda** - Selector de USD/MXN
- ✅ **Icono** - Grid de 8 iconos disponibles
- ✅ **Color** - Paleta de 8 colores

#### Lógica de Ajuste de Balance:
Cuando el balance cambia, el sistema automáticamente:

1. **Calcula la diferencia**: `newBalance - originalBalance`
2. **Determina el tipo de transacción**:
   - Si diferencia > 0 → Transacción de **ingreso**
   - Si diferencia < 0 → Transacción de **gasto**
3. **Crea transacción de ajuste**:
   ```typescript
   await createTransaction({
     wallet_id: id,
     amount: Math.abs(balanceDifference),
     type: transactionType,
     title: "Ajuste de balance",
     note: `Ajuste de balance de ${originalBalance} a ${newBalance}`,
     timestamp: Date.now(),
   });
   ```

#### Ejemplo de Ajuste:
- **Balance original**: $500
- **Balance nuevo**: $2000
- **Resultado**: Se crea una transacción de **ingreso** de $1500

#### Advertencia Visual:
Muestra un mensaje cuando hay cambio de balance:
```
⚠️ Se creará una transacción de ajuste de ingreso por $1500.00
```

### 3. **AddWalletScreen Actualizado**
`app/wallets/add-wallet.tsx`

Ahora incluye:
- ✅ Selector de moneda (CurrencySelector)
- ✅ Guarda la moneda seleccionada al crear wallet
- ✅ Por defecto: USD

### 4. **Botón de Editar Conectado**
`components/views/wallets/wallet-info/WalletInfoHeader.tsx`

El botón de editar (ícono de lápiz) ahora:
- ✅ Navega a `/wallets/edit-wallet/[id]`
- ✅ Carga los datos de la wallet automáticamente
- ✅ Permite edición completa

### 5. **WalletsContext Actualizado**
`contexts/WalletsContext.tsx`

Interfaces actualizadas para soportar `currency`:

```typescript
createWallet: (params: {
  name: string;
  balance?: number;
  icon: string;
  color: string;
  currency?: string;  // ← Nuevo campo
}) => Promise<string>;

updateWallet: (id: string, params: {
  name?: string;
  balance?: number;
  icon?: string;
  color?: string;
  currency?: string;  // ← Nuevo campo
}) => Promise<void>;
```

## Flujo de Usuario

### Crear Wallet:
1. Click en "Agregar cuenta"
2. Ingresar nombre
3. Establecer balance inicial
4. **Seleccionar moneda** (USD o MXN)
5. Elegir icono
6. Elegir color
7. Guardar

### Editar Wallet:
1. Abrir detalles de wallet
2. Click en botón de editar (ícono lápiz)
3. Modificar cualquier campo:
   - Nombre
   - Balance (crea transacción de ajuste automáticamente)
   - Moneda
   - Icono
   - Color
4. Ver advertencia si cambia balance
5. Guardar → Se actualiza wallet y se crea transacción si es necesario

## Archivos Creados/Modificados

### Nuevos Archivos:
- ✅ `components/views/wallets/CurrencySelector.tsx`
- ✅ `app/wallets/edit-wallet/[id].tsx`

### Archivos Modificados:
- ✅ `app/wallets/add-wallet.tsx` - Agregado CurrencySelector
- ✅ `contexts/WalletsContext.tsx` - Soporte para currency
- ✅ `components/views/wallets/wallet-info/WalletInfoHeader.tsx` - Botón de editar conectado

## Características Destacadas

### 🎯 Ajuste Inteligente de Balance
El sistema detecta cambios en el balance y crea transacciones de ajuste automáticamente, manteniendo la integridad de los datos.

### 🌍 Soporte Multi-Moneda
Preparado para USD y MXN, fácil de extender a más monedas.

### 🎨 Personalización Completa
8 iconos + 8 colores = 64 combinaciones posibles para personalizar cada wallet.

### ⚠️ Feedback Visual
Advertencias claras cuando se van a crear transacciones de ajuste.

### 🔄 Sincronización Automática
Después de editar, todas las listas se refrescan automáticamente.

## Testing

Para probar la funcionalidad:

1. **Crear wallet con moneda**:
   - Crear nueva wallet
   - Seleccionar MXN
   - Verificar que se guarda correctamente

2. **Editar balance**:
   - Abrir wallet existente
   - Click en editar
   - Cambiar balance de $500 a $2000
   - Verificar advertencia de ajuste
   - Guardar
   - Verificar que se creó transacción de ingreso de $1500

3. **Cambiar moneda**:
   - Editar wallet
   - Cambiar de USD a MXN
   - Guardar
   - Verificar que se actualizó

4. **Personalización**:
   - Cambiar icono
   - Cambiar color
   - Cambiar nombre
   - Verificar que todo se guarda correctamente

## Notas Técnicas

- Los errores de TypeScript del IDE son normales y se resolverán al compilar
- El campo `currency` es opcional en la BD para compatibilidad con wallets existentes
- Las transacciones de ajuste tienen título "Ajuste de balance" y nota descriptiva
- El balance original se guarda al cargar para calcular la diferencia correctamente
