# FinanzIA 💰

<div align="center">
  <h3>Gestiona tus finanzas personales con inteligencia artificial</h3>
  <p>Aplicación móvil para el control de gastos, presupuestos y planificación financiera</p>
</div>

## Descripción

**FinanzIA** es una aplicación móvil multiplataforma de gestión financiera personal desarrollada con React Native y Expo. Permite a los usuarios administrar múltiples billeteras, realizar seguimiento de transacciones, controlar suscripciones y recibir planes financieros personalizados generados por inteligencia artificial.

## Características principales

- **Multi-billetera** - Gestiona múltiples cuentas con diferentes monedas
- **Seguimiento de transacciones** - Registra ingresos, gastos y transferencias entre billeteras
- **Gestión de suscripciones** - Control automático de pagos recurrentes (diario, semanal, mensual, anual)
- **Presupuestos** - Establece límites de gasto por categoría
- **Objetivos financieros** - Define y rastrea metas de ahorro o reducción de deuda
- **Categorías personalizables** - Organiza tus transacciones con categorías y etiquetas
- **Planificación con IA** - Obtén planes financieros personalizados usando OpenAI GPT-4
- **Estadísticas visuales** - Gráficos interactivos de tus finanzas
- **Multi-moneda** - Soporte para diferentes divisas por billetera
- **Modo oscuro** - Interfaz adaptativa según preferencias del sistema
- **Actualizaciones OTA** - Recibe mejoras automáticamente sin reinstalar

## Tecnologías utilizadas

### Core
- **React Native** `0.79.6` - Framework móvil multiplataforma
- **Expo** `~53.0` - Plataforma de desarrollo y deployment
- **Expo Router** `~5.1` - Navegación basada en archivos
- **TypeScript** `~5.8` - Tipado estático

### UI/UX
- **NativeWind** `^4.1` - Tailwind CSS para React Native
- **React Native Reanimated** `~3.17` - Animaciones fluidas
- **Expo Symbols** - Iconografía SF Symbols
- **Gifted Charts** - Gráficos estadísticos

### Base de datos
- **Expo SQLite** `^15.2` - Base de datos local con soporte FTS
- **Migraciones versionadas** - Sistema de versionado de esquema (v8)

### Inteligencia Artificial
- **Vercel AI SDK** `^5.0` - Framework para integración de IA
- **OpenAI** `^2.0` - Modelo GPT-4o-mini para planes financieros

### Otras dependencias clave
- **React Native UUID** - Generación de identificadores únicos
- **Date-fns** - Manipulación de fechas
- **Expo Notifications** - Notificaciones push
- **Async Storage** - Persistencia de datos clave-valor

## Instalación

### Prerrequisitos

- Node.js 18+ y npm
- Expo CLI
- Para desarrollo nativo:
  - **iOS**: macOS con Xcode instalado
  - **Android**: Android Studio con SDK configurado

### Configuración inicial

1. Clona el repositorio:
```bash
git clone https://github.com/RogelioLB/finanzIA.git
cd finanzIA
```

2. Instala las dependencias:
```bash
npm install
```

3. (Opcional) Configura la API de OpenAI para planes financieros:
```bash
# Crea el archivo .env.local
echo "OPENAI_API_KEY=sk-tu-clave-aqui" > .env.local
```

Ver [AI_PLAN_SETUP.md](./AI_PLAN_SETUP.md) para más detalles.

## Comandos de desarrollo

```bash
# Iniciar servidor de desarrollo
npm start

# Iniciar con variante de desarrollo
npm run dev

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios

# Ejecutar en web
npm run web

# Linter
npm run lint
```

## Estructura del proyecto

```
finanzIA/
├── app/                      # Rutas y pantallas (Expo Router)
│   ├── (tabs)/              # Navegación por pestañas
│   │   ├── index.tsx        # Pantalla principal (Dashboard)
│   │   ├── history.tsx      # Historial de transacciones
│   │   ├── statistic.tsx    # Estadísticas y gráficos
│   │   ├── ai-plan.tsx      # Planificación con IA
│   │   └── more.tsx         # Configuración y más opciones
│   └── api/                 # Endpoints API
│       └── generate-plan+api.ts  # Generación de planes con OpenAI
├── components/              # Componentes reutilizables
│   └── views/              # Componentes específicos de vistas
├── contexts/               # Proveedores de Context API
│   ├── WalletsContext.tsx
│   ├── TransactionsContext.tsx
│   ├── CategoriesContext.tsx
│   ├── AddTransactionContext.tsx
│   └── NotificationsContext.tsx
├── hooks/                  # Custom hooks
├── lib/
│   └── database/          # Configuración y servicios SQLite
│       ├── initDatabase.ts      # Esquema y migraciones
│       └── sqliteService.ts     # CRUD operations
├── constants/             # Colores y constantes
└── assets/               # Imágenes, fuentes, etc.
```

## Arquitectura y patrones

### Gestión de estado

Cada dominio tiene un Context provider con hook correspondiente:

```typescript
// Uso típico
import { useWallets } from '@/contexts/WalletsContext';

function MyComponent() {
  const { wallets, refreshWallets } = useWallets();
  // ... lógica del componente
}
```

**Importante**: Siempre llama a `refreshTransactions()` o `refreshWallets()` después de mutaciones en la base de datos.

### Esquema de base de datos

Versión actual: **8**

Tablas principales:
- `wallets` - Billeteras con balance, moneda, icono y color
- `categories` - Categorías de ingreso/gasto (precargadas en español)
- `transactions` - Registros de transacciones con soporte para suscripciones
- `budgets` / `category_budget_limits` - Presupuestos
- `objectives` - Objetivos financieros
- `labels` / `transaction_labels` - Etiquetas para transacciones

### Tipos de transacciones

- `income` - Ingresos
- `expense` - Gastos
- `transfer` - Transferencias entre billeteras (usa `to_wallet_id`)
- **Suscripciones**: Marca `is_subscription=1` con `subscription_frequency` (daily/weekly/monthly/yearly)
- **Exclusión de IA**: Flag `is_excluded` excluye transacciones del análisis de IA

### Multi-moneda

Cada billetera tiene su propia moneda. La agregación de balances agrupa por moneda usando `Intl.NumberFormat`.

## Variantes de build

El proyecto soporta dos variantes configuradas en `app.config.js`:

| Variante | Comando | Nombre de app | Bundle ID |
|----------|---------|---------------|-----------|
| **Desarrollo** | `npm run dev` | FinanzIA (Dev) | `com.rogeliolb.finanzia.dev` |
| **Producción** | `npm start` | FinanzIA | `com.rogeliolb.finanzia` |

Ver [BUILD_VARIANTS_SETUP.md](./BUILD_VARIANTS_SETUP.md) para más detalles.

## Despliegue automático con EAS

El proyecto está configurado para actualizaciones automáticas over-the-air (OTA) cuando se hace push a las ramas `main` o `master`.

### Configuración requerida

1. Genera un token de acceso en https://expo.dev/settings/access-tokens
2. Agrega el secreto `EXPO_TOKEN` en la configuración del repositorio de GitHub
3. Crea un build inicial de producción:
```bash
eas build --platform all --profile production
```

**Nota**: Los cambios en código nativo, plugins o `eas.json` requieren un nuevo build completo. Solo los cambios en JS/React se pueden desplegar vía OTA.

Ver [EAS_AUTO_DEPLOY.md](./EAS_AUTO_DEPLOY.md) para instrucciones completas.

## Planificación financiera con IA

La función de planificación con IA requiere:
- Mínimo 10 transacciones registradas
- Clave API de OpenAI configurada en `.env.local`
- Endpoint: `POST /api/generate-plan+api`

El sistema analiza transacciones (excepto las marcadas con `is_excluded`) y genera planes personalizados de ahorro, reducción de gastos y consejos financieros.

## Convenciones del proyecto

- **Timestamps**: Se almacenan como milisegundos desde epoch
- **UUIDs**: Generados via `react-native-uuid` para todas las entidades
- **Funciones de base de datos**: Siguen el patrón `get*()`, `create*()`, `update*()`, `delete*()` en `sqliteService.ts`
- **Idioma de UI**: Español (nombres de categorías, etiquetas, textos)

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Haz fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commitea tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Autor

**Rogelio López Blanco** - [@RogelioLB](https://github.com/RogelioLB)

---

<div align="center">
  Hecho con ❤️ usando React Native y Expo
</div>
