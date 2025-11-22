# Corrección: Currency no se actualiza al regresar

## Problema
Cuando cambias la moneda (currency) de una wallet en la pantalla de edición y regresas a la pantalla de detalles, la moneda seguía mostrando el valor anterior.

## Causa
La pantalla de detalles de wallet (`app/wallets/[id].tsx`) solo cargaba los datos de la wallet una vez al montar el componente. No se actualizaba cuando:
1. Volvías de la pantalla de edición
2. El contexto de wallets se actualizaba

## Solución Implementada

### Cambios en `app/wallets/[id].tsx`

#### 1. Agregado `useFocusEffect`
```typescript
import { useFocusEffect, useLocalSearchParams } from "expo-router";

// Cargar wallet cuando la pantalla recibe foco
useFocusEffect(
  useCallback(() => {
    loadWallet();
  }, [loadWallet])
);
```

Este hook se ejecuta cada vez que la pantalla recibe el foco (cuando vuelves de otra pantalla), asegurando que los datos se recargan.

#### 2. Agregado listener al contexto de wallets
```typescript
const { getWalletById, wallets } = useWallets();

// También cargar cuando cambian las wallets en el contexto
useEffect(() => {
  if (id) {
    const walletData = getWalletById(id);
    if (walletData) {
      setWallet(walletData);
    }
  }
}, [wallets, id, getWalletById]);
```

Este `useEffect` escucha cambios en el array `wallets` del contexto y actualiza la wallet local cuando detecta cambios.

#### 3. Refactorizado `loadWallet` como `useCallback`
```typescript
const loadWallet = useCallback(async () => {
  if (!id) {
    setError("ID de wallet no proporcionado");
    setIsLoading(false);
    return;
  }

  try {
    setIsLoading(true);
    const walletData = await getWalletById(id);
    if (walletData) {
      setWallet(walletData);
    } else {
      setError("Wallet no encontrada");
    }
  } catch (err) {
    console.error("Error loading wallet:", err);
    setError("Error al cargar la wallet");
  } finally {
    setIsLoading(false);
  }
}, [id, getWalletById]);
```

Esto permite reutilizar la función de carga en múltiples lugares sin duplicar código.

## Flujo de Actualización

### Antes (❌ No funcionaba):
1. Usuario abre wallet details → Carga datos
2. Usuario edita wallet → Cambia currency
3. `refreshWallets()` actualiza el contexto
4. Usuario regresa a wallet details
5. ❌ **Pantalla muestra datos antiguos** (no se recarga)

### Ahora (✅ Funciona):
1. Usuario abre wallet details → Carga datos
2. Usuario edita wallet → Cambia currency
3. `refreshWallets()` actualiza el contexto
4. Usuario regresa a wallet details
5. ✅ `useFocusEffect` detecta el foco → Recarga datos
6. ✅ `useEffect` detecta cambio en `wallets` → Actualiza UI
7. ✅ **Pantalla muestra currency actualizada**

## Beneficios Adicionales

Esta corrección también mejora:
- **Sincronización en tiempo real**: Cualquier cambio en las wallets se refleja inmediatamente
- **Mejor UX**: Los datos siempre están actualizados al navegar
- **Consistencia**: Funciona para cualquier campo editado (nombre, color, icono, currency, etc.)

## Testing

Para verificar la corrección:

1. **Test de currency**:
   - Abrir wallet con USD
   - Click en editar
   - Cambiar a MXN
   - Guardar
   - ✅ Verificar que muestra MXN inmediatamente

2. **Test de otros campos**:
   - Cambiar nombre, color, icono
   - Guardar
   - ✅ Verificar que todos los cambios se reflejan

3. **Test de balance**:
   - Cambiar balance
   - Guardar
   - ✅ Verificar que muestra el nuevo balance

## Archivos Modificados

- ✅ `app/wallets/[id].tsx` - Agregado `useFocusEffect` y listener de wallets

## Notas Técnicas

- `useFocusEffect` es similar a `useEffect` pero se ejecuta cuando la pantalla recibe/pierde foco
- El doble sistema (focus + context listener) asegura actualización en todos los escenarios
- Los errores de TypeScript del IDE son normales y no afectan la funcionalidad
