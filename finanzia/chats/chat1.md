# Expense Tracker App

_Started 2026-05-02 21:54 UTC_

---

## User



## Assistant

I'll design FinanzIA as an original interactive prototype. Let me start by gathering some quick context, then build.

_[tool: questions_v2]_

## User

Questions answered:
- fidelity: Single iPhone prototype, navigable between screens (recommended)
- default_accent: 3
- default_theme: Dark
- currency: MXN ($)
- typography: Geist (modern, similar feel)
- data_realism: Realistic Mexican household (Mercado, Uber, CFE…)
- interactions: Tab navigation between 4 screens
- voice_button: Visual mock with animation
- tweaks: Accent color (also in Settings, but quicker), Theme light/dark, Density (compact/comfortable), Numpad style (calculator vs phone layout), FAB style (centered notch vs floating), Decide for me

## Assistant

I'll build FinanzIA as a fully interactive iPhone prototype with all 5 screens, navigable between tabs, with a working numpad, theme toggle, and accent color picker.

**System I'll use:**
- **Type:** Geist (Google Fonts), monospace numerals via Geist Mono
- **Theme:** Dark default (#0A0A0A bg, soft white text), light alternative (#FAFAFA bg)
- **Default accent:** Orange #FF6B35
- **Currency:** MXN with realistic Mexican data (Oxxo, Mercado, CFE, Uber, Rappi, Spotify, Nu)
- **Layout:** 390×844 iPhone frame, custom 4-tab nav, centered FAB notch
- **Icons:** Hand-drawn SVG line icons (simple, no slop)

_[tool: update_todos]_

_[tool: copy_starter_component]_

_[tool: copy_starter_component]_

_[tool: read_file]_

I have what I need. I'll build my own custom 390x844 frame (briefed size) and components since FinanzIA has unique chrome (custom tab bar with FAB notch, no iOS-style chrome). Let me write the prototype.

_[tool: write_file]_

Now the theme system, data, and core helpers:

_[tool: write_file]_

_[tool: snip]_

Now the screen components. Starting with the device frame and navigation:

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: done]_

_[tool: snip]_

_[tool: fork_verifier_agent]_

Built **FinanzIA** as an interactive iPhone prototype (390×844) with all 5 screens.

**Built:**
- 4-tab nav (Inicio, Gastos, Deudas, Sobres) with centered FAB notch
- Dashboard, expense list, debts with payment plan modal, envelope grid, in-app theme settings
- Working numpad bottom sheet, category picker, payment method, voice mock with pulse animation
- Live theme system: dark default, light alt, 12-color accent palette + custom hex picker
- Realistic MX data (Mercado Roma, OXXO, CFE, Rappi, Nu, BBVA…)
- Geist + Geist Mono typography, tabular nums throughout

**Tweaks panel:** theme, accent (color picker + swatches), density, FAB style (notch/floating), numpad layout (calculator/phone), plus shortcut buttons.

Try: tap the FAB to open quick-expense, tap a debt to see payment plan, tap the gear icon on home → settings opens with live preview.

## User

genera el prompt para pasar este diseño a una app mobile que ya tengo creada con expo

## Assistant

_[tool: snip]_

# Prompt para Claude Code / Cursor — Migrar FinanzIA a Expo

Copia y pega este prompt en tu agente de código (Claude Code, Cursor, etc.) dentro del proyecto Expo:

---

**Contexto:** Tengo un prototipo HTML/React de una app llamada **FinanzIA** (gestión de finanzas personales en español, mercado mexicano). Necesito migrarlo a mi app Expo / React Native existente, manteniendo el diseño visual exacto y la estructura de navegación.

**Stack destino:**
- Expo (SDK actual) + React Native
- Navegación: `@react-navigation/native` + `@react-navigation/bottom-tabs` + `@react-navigation/native-stack`
- Tipografía: `expo-font` con **Geist** y **Geist Mono** (Google Fonts → descargar `.ttf` a `assets/fonts/`)
- Iconos: SVG inline con `react-native-svg` (no uses librerías de iconos; replica los trazos del prototipo)
- Estado de tema: Context API (`ThemeProvider`) con `accent` y `mode` (light/dark) + persistencia con `AsyncStorage`
- Localización: `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`

---

## Sistema de diseño

**Theme dark (default):**
```
bg #0A0A0A · surface #141414 · surfaceAlt #1C1C1E
text #FAFAFA · textSec rgba(250,250,250,0.62) · textTer rgba(250,250,250,0.38)
border rgba(255,255,255,0.07) · divider rgba(255,255,255,0.06)
good #3DDC84 · bad #FF6B6B
```
**Theme light:**
```
bg #FAFAFA · surface #FFFFFF · surfaceAlt #F4F4F5
text #0A0A0A · textSec rgba(10,10,10,0.62) · textTer rgba(10,10,10,0.40)
border rgba(0,0,0,0.07) · divider rgba(0,0,0,0.06)
good #0F8A3F · bad #D14343
```
**Accent default:** `#FF6B35` (orange). Paleta seleccionable: `#FF6B35, #0A84FF, #34C759, #AF52DE, #FF375F, #FFCC00, #5AC8FA, #A78BFA, #F472B6, #10B981, #F59E0B, #FAFAFA`.

**Tipografía:** Geist 400/500/600/700 para texto general; **Geist Mono** o `fontVariant: ['tabular-nums']` para todos los montos. Tamaños clave: hero balance 56/-2.4, títulos pantalla 28/-1.2, valores secundarios 16-20/-0.5, body 13-14, caption 11-12.

**Radios:** Cards 18-22, botones 12-16, chips 100, FAB 32. **Padding:** 20 horizontal en pantallas, 14-18 en cards.

---

## Estructura de pantallas (4 tabs + 2 modales)

**Tabs (BottomTabNavigator):**
1. **`Home`** — Saldo neto hero, progreso del mes con barra, 2-up (Ahorros / Deudas), card de inversión Nu con sparkline SVG, lista de movimientos recientes.
2. **`Expenses`** — Header con totales, fila de chips de filtro horizontal, transacciones agrupadas por día.
3. **`Debts`** — Card total con barra de progreso, lista de cards de deuda (cada una abre `DebtDetail`).
4. **`Envelopes`** — Card "Disponible", grid 2-col de sobres (con estado normal/casi/excedido), botón "+ Nuevo sobre".

**Tab bar custom:** 4 tabs + **FAB centrado con notch** (botón flotante de `+` que rompe la barra). El FAB abre el `QuickExpenseSheet`. Soportar también variante `floating` (FAB en bottom-right sobre tab bar plana) — control vía settings.

**Modales (Stack sobre tabs):**
- **`QuickExpenseSheet`** (presentation: `'modal'` con bottom-sheet animado): Display del monto grande (`$0`), fila scrollable de 8 categorías (Comida, Transporte, Diversión, Hogar, Salud, Compras, Servicios, Educación), input de nota colapsable, segmentado de método (Efectivo / Débito / Crédito), **numpad propio 3×4** (NO usar teclado nativo) con dos layouts intercambiables (calculadora `789/456/123/.0⌫` y teléfono `123/456/789/.0⌫`), botón mic con animación de pulso (mock que tras 1.8s rellena monto/categoría/nota), botón "Guardar gasto".
- **`DebtDetail`**: Header con back, restante grande, barra de progreso, grid 2×2 de stats (Original, Pagado, Pago mensual, Liquidación), lista de próximos 6 pagos con balance restante, botón "Adelantar un pago".
- **`SettingsScreen`**: Card de preview en vivo (balance + barra + botones usando el accent actual), toggle de tema (Claro/Oscuro), grid 6×2 de swatches de accent con check en el activo, fila expandible para hex personalizado con `<input type=color>` equivalente (usa `react-native-color-picker` o un modal con sliders RGB).

---

## Datos de ejemplo (hardcoded por ahora, en `src/data/mock.ts`)

```ts
export const TRANSACTIONS = [
  { id:'t1', merchant:'Mercado Roma', cat:'Food', amount:-487, method:'card', when:'Hoy · 14:23' },
  { id:'t2', merchant:'Uber', cat:'Transport', amount:-132, method:'card', when:'Hoy · 09:11' },
  { id:'t3', merchant:'Spotify', cat:'Fun', amount:-169, method:'card', when:'Ayer' },
  { id:'t4', merchant:'OXXO', cat:'Food', amount:-85, method:'cash', when:'Ayer' },
  { id:'t5', merchant:'CFE', cat:'Home2', amount:-892, method:'debit', when:'28 abr' },
  { id:'t6', merchant:'Rappi', cat:'Food', amount:-245, method:'credit', when:'27 abr' },
  { id:'t7', merchant:'Farmacia del Ahorro', cat:'Health', amount:-340, method:'debit', when:'26 abr' },
  { id:'t8', merchant:'Cinépolis', cat:'Fun', amount:-180, method:'credit', when:'25 abr' },
];

export const DEBTS = [
  { id:'d1', name:'Tarjeta Nu', original:18500, paid:11200, monthly:1850, due:'Sep 2026', apr:'34.9%' },
  { id:'d2', name:'Préstamo familiar', original:25000, paid:22000, monthly:1500, due:'Jul 2026', apr:'0%' },
  { id:'d3', name:'BBVA Crédito Auto', original:142000, paid:38400, monthly:3200, due:'Mar 2030', apr:'12.4%' },
  { id:'d4', name:'MSI iPhone', original:24999, paid:20832, monthly:2083, due:'Oct 2026', apr:'0%' },
];

export const ENVELOPES = [
  { id:'e1', name:'Despensa', icon:'Food', budget:6500, spent:4820 },
  { id:'e2', name:'Transporte', icon:'Transport', budget:1500, spent:1380 },
  { id:'e3', name:'Entretenimiento', icon:'Fun', budget:1200, spent:1340 }, // excedido
  { id:'e4', name:'Servicios', icon:'Bolt', budget:2400, spent:1892 },
  { id:'e5', name:'Salud', icon:'Health', budget:1000, spent:340 },
  { id:'e6', name:'Renta', icon:'Home2', budget:12000, spent:12000 },
  { id:'e7', name:'Mascota', icon:'Pet', budget:800, spent:215 },
  { id:'e8', name:'Educación', icon:'Education', budget:1500, spent:0 },
];
```

Estados de envelope: `normal` (verde/accent), `casi` (≥80% gastado, naranja `#F59E0B`), `excedido` (>100%, rojo `theme.bad`) — borde de la card cambia, badge de texto en esquina superior derecha.

---

## Estructura de carpetas sugerida

```
src/
  theme/
    ThemeProvider.tsx
    tokens.ts
  navigation/
    RootNavigator.tsx
    TabBar.tsx       // custom con FAB notch
  components/
    Icon/             // un componente por glifo, todos con props {size, color, stroke}
    TxRow.tsx
    DebtCard.tsx
    EnvelopeCard.tsx
    SummaryCard.tsx
    Sparkline.tsx
  screens/
    HomeScreen.tsx
    ExpensesScreen.tsx
    DebtsScreen.tsx
    DebtDetailScreen.tsx
    EnvelopesScreen.tsx
    QuickExpenseSheet.tsx
    SettingsScreen.tsx
  data/mock.ts
  utils/format.ts     // MXN(), MXN_decimal(), getFabContrast()
```

---

## Detalles importantes de implementación

1. **Tab bar custom:** `BottomTabBar` reemplazado por componente propio (`Pressable` + `View` absolutos). El FAB es un `Pressable` con `position: 'absolute'`, `top: -22`, `border: 4px solid theme.bg` (para crear el "notch" visual). El icono usa `getFabContrast(accent)` para elegir blanco/negro según luminancia.

2. **Bottom sheet del quick-expense:** Usar `@gorhom/bottom-sheet` o un `Modal` con `Animated.View` deslizando desde abajo. Al abrir, NO mostrar el teclado nativo — el numpad propio es la entrada.

3. **Sparkline:** SVG con `<Path>` de `react-native-svg`. 8 puntos hardcoded por ahora.

4. **Animación del mic:** `Animated.loop` con scale 1→1.15 + opacity 0.6→0, duración 1.2s.

5. **Persistencia:** Guarda `accent`, `mode`, `numpadStyle`, `density`, `fabStyle` en `AsyncStorage` con clave `finanzia.tweaks`.

6. **Formato MXN:** Sin decimales en listas (`$487`), con decimales en hero (`$48,732.50` con la parte decimal en color `textTer` y tamaño menor). Usa `−` (U+2212) para negativos, no `-`. `fontVariant: ['tabular-nums']` en todo lo numérico.

7. **Safe areas:** `react-native-safe-area-context` — el header de cada pantalla debe respetar el inset top.

---

## Lo que NO debes hacer

- No uses Tailwind / NativeWind salvo que ya esté configurado
- No agregues librerías de iconos (Feather, Ionicons, etc.) — replica los trazos
- No uses `Alert` ni el teclado nativo en el quick-expense
- No inventes pantallas u onboarding extra
- Mantén todo el copy en **español de México**

---

**Empieza por:** (1) instalar deps faltantes, (2) `ThemeProvider` + tokens, (3) navigator con tab bar custom + FAB, (4) `HomeScreen` completa, luego el resto de pantallas, y al final el `QuickExpenseSheet`. Pregúntame antes de hacer cambios al `App.tsx` raíz.

---

Si quieres que adapte el prompt para una librería de UI específica que ya uses (Tamagui, Restyle, gluestack…), dime cuál y lo reescribo.

## User

Ahora crea las pantallas para crear las cuentas, por ejemplo de banco, tarjetas de credito, debito, efectivo, la pantalla para menejar las inversiones, la pantalla para ver los gastos, los gastos quiero que se miren de forma mensual donde se le de un swipe para cambiar los meses, en el centro el actual, y a los lados 6 meses atras y 6 meses adelante

## Assistant

_[tool: snip]_

Voy a agregar 3 pantallas nuevas:

1. **Cuentas** — lista de bancos/tarjetas/efectivo con saldos, drill-down a detalle, FAB para agregar (con flow de selección de tipo).
2. **Inversiones** — portafolio con assets, gráfica de rendimiento, lista de holdings.
3. **Gastos mensuales** — reemplaza pantalla actual de Gastos: carrusel swipeable de meses (6 atrás / actual / 6 adelante), con totales y desglose por categoría del mes seleccionado.

Voy a sumar también un 5º tab para Cuentas+Inversiones, manteniendo el FAB centrado.

_[tool: read_file]_

_[tool: snip]_

_[tool: str_replace_edit]_

## User

no sumes otra tab, mantentlo asi, solo que quita sobres del tab y cambialo por un mas, donde ahi estaran las pantallas extras que no son tan necesarias

## Assistant

Perfecto. Reemplazo el tab "Sobres" por **"Más"** que abre un menú con: Sobres, Cuentas, Inversiones, Ajustes. La pantalla de **Gastos** se convierte en la mensual con swipe.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

I'll add a few more icon glyphs needed (Bank, ChartUp, Wallet2, Crypto, etc.), update the tab bar to have "Más", build the new screens, and wire them in.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: write_file]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

_[tool: fork_verifier_agent]_

_[tool: snip]_

Listo. Cambios:

**Tab bar:** Sobres → **Más** (icono de tres puntos).

**Pantalla "Más"** abre 4 secciones: Sobres, Cuentas, Inversiones, Apariencia.

**Cuentas:** agrupa por Débito / Crédito / Efectivo / Billeteras. Card de líquido + crédito usado/disponible, toggle de ojo para ocultar saldos, barra de utilización en tarjetas de crédito, FAB "Agregar cuenta" abre bottom sheet con tipos (débito, crédito, efectivo, billetera, inversión). Datos: BBVA, Nu, Banorte, Santander, Mercado Pago.

**Inversiones:** valor total, % ganado, gráfica de área con gradiente verde/rojo según signo, selector de rango (1S/1M/3M/6M/1A/Todo), barra de asignación por activo con leyenda, lista de holdings (CETES, NAFTRAC, VOO, BTC, Caja Nu) con cambio diario y P&L total.

**Gastos mensuales:** carrusel horizontal de 13 meses (6 atrás · actual marcado con punto · 6 adelante en gris "Proyectado"). El mes seleccionado muestra hero con total + Δ vs mes anterior, ingreso/ahorro, desglose por categoría con barras, y lista de movimientos (solo en mes actual).

Tap en cualquier mes para enfocar; el seleccionado se centra solo.

## User

Verifier agent check completed

## Assistant

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: done]_

Centrado del mes corregido — ahora May 2026 aparece al centro al cargar Gastos.

## User

Ahora tambien una de suscripciones o pagos futuros, por ejemplo, el ingreso de mi salario, o suscripciones como youtube premium, claude code, etc, tener en cuenta que las suscripciones se tienen que pagar solas o descontar del saldo cuando llega a la hora y fecha limite, y en el añadir gasto, es añadir transaccion, debe perimitir aumentar o disminuir el saldo total, permitiendo escoger la cuenta, asi como esta, pero seleccionando de que tarjeta o de que banco

## Assistant

_[tool: snip]_

Voy a hacer:

1. **Pantalla "Pagos recurrentes"** (en menú "Más") con: ingresos recurrentes (salario), suscripciones, próximos pagos en calendario, total mensual neto.
2. **Renombrar "Nuevo gasto" → "Nueva transacción"** con toggle Gasto / Ingreso, selector de cuenta de origen.

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: snip]_

_[tool: str_replace_edit]_

_[tool: write_file]_

Now I'll rewrite the QuickExpense component into a "Nueva transacción" sheet with income/expense toggle and account selector:

_[tool: write_file]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: str_replace_edit]_

_[tool: done]_

Listo. Agregué dos cosas:

**1. Pagos recurrentes** (en pestaña Más → Pagos recurrentes)
- Card de flujo neto mensual: Ingresos vs Suscripciones
- Próximos 7 días destacados
- Listas separadas: Ingresos (Sueldo, Freelance) y Suscripciones (Spotify, Netflix, Claro, gym, iCloud, etc.)
- Cada fila muestra día del mes, próxima fecha y cuenta de cargo

**2. FAB ahora abre "Nueva transacción"** (no solo gasto):
- Toggle Gasto / Ingreso arriba — el monto cambia color (verde para ingreso) y signo (+/−)
- Selector de cuenta expandible: ves saldo de cada una y eliges desde dónde sale (o entra) el dinero
- Las categorías solo aparecen para gastos
- Botón final dice "Guardar gasto" o "Registrar ingreso" según corresponda

_[tool: update_todos]_

_[tool: fork_verifier_agent]_

_[tool: snip]_

¿Algo más que quieras ajustar o agregar?

## User

Verifier agent check completed

## Assistant

## User

Save as standalone HTML: FinanzIA.html

## Assistant

