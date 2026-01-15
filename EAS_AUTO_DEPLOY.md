# Configuración de Auto-Deploy con EAS Update

Este documento explica cómo está configurado el auto-deploy en FinanzIA para que las actualizaciones se publiquen automáticamente cuando se hace push a las ramas principales.

## ¿Qué es EAS Update?

EAS Update permite publicar actualizaciones Over-The-Air (OTA) a tus apps sin necesidad de volver a publicar en las tiendas. Cuando haces cambios en JavaScript, componentes de React, o assets, los usuarios recibirán la actualización automáticamente.

**Nota importante**: Los cambios nativos (modificaciones en `eas.json`, plugins de Expo, configuraciones nativas de iOS/Android) requieren un nuevo build completo con `eas build`.

## Configuración Actual

### 1. Canales Configurados

En `eas.json` tenemos tres canales:

- **production**: Para builds y updates de producción (rama `main`/`master`)
- **preview**: Para builds y updates de prueba
- **development**: Para desarrollo local

### 2. Workflow de GitHub Actions

El archivo `.github/workflows/eas-update.yml` se ejecuta automáticamente cuando:

- Se hace push a la rama `master` o `main`
- Se hace merge de un PR a estas ramas

El workflow publicará automáticamente un update al canal `production`.

## Configuración Inicial Requerida

### Paso 1: Generar un Token de Expo

1. Ve a https://expo.dev/accounts/[tu-usuario]/settings/access-tokens
2. Crea un nuevo token con el nombre "GitHub Actions" o similar
3. Copia el token generado (solo se muestra una vez)

### Paso 2: Configurar el Secret en GitHub

1. Ve a tu repositorio en GitHub
2. Navega a **Settings** > **Secrets and variables** > **Actions**
3. Click en **New repository secret**
4. Nombre: `EXPO_TOKEN`
5. Valor: Pega el token generado en el Paso 1
6. Click en **Add secret**

### Paso 3: Crear un Build Inicial

Antes de poder publicar updates, necesitas crear al menos un build con el canal configurado:

```bash
# Para producción
eas build --platform android --profile production
eas build --platform ios --profile production

# O para ambas plataformas
eas build --platform all --profile production
```

**Importante**: Los builds deben estar instalados en los dispositivos para recibir los updates. Los updates solo funcionan con builds que tienen el mismo `runtimeVersion`.

### Paso 4: Instalar la App en Dispositivos de Prueba

1. Descarga el build desde tu dashboard de Expo (https://expo.dev)
2. Instala el APK en Android o el build en iOS
3. Abre la app para verificar que funciona

## Uso Diario

Una vez configurado, el flujo de trabajo es simple:

1. Haz cambios en tu código (JavaScript, React, componentes, estilos, etc.)
2. Commit y push a la rama `master` o `main`:
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin master
   ```
3. GitHub Actions publicará automáticamente el update
4. Las apps instaladas recibirán el update en el próximo reinicio

## Verificar que un Update fue Publicado

Puedes verificar que tu update se publicó correctamente:

1. Ve a tu proyecto en https://expo.dev
2. Navega a la sección **Updates**
3. Deberías ver tu update más reciente en el canal `production`

## Publicar Updates Manualmente

Si necesitas publicar un update manualmente (sin usar GitHub Actions):

```bash
# Update a producción
eas update --branch production --message "Descripción del update"

# Update a preview
eas update --branch preview --message "Descripción del update"

# Update a development
eas update --branch development --message "Descripción del update"
```

## Forzar Actualización en la App

Por defecto, los updates se descargan en segundo plano y se aplican en el próximo reinicio. Si quieres que la app verifique updates inmediatamente, puedes agregar código en tu app:

```typescript
import * as Updates from 'expo-updates';

// Verificar y aplicar updates
async function onFetchUpdateAsync() {
  try {
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch (error) {
    console.log('Error al verificar updates:', error);
  }
}
```

## Troubleshooting

### El workflow falla con "EXPO_TOKEN not found"
- Verifica que agregaste el secret `EXPO_TOKEN` en GitHub (ver Paso 2)
- Asegúrate de que el nombre sea exactamente `EXPO_TOKEN` (mayúsculas)

### Los updates no llegan a los dispositivos
- Verifica que el build instalado esté en el mismo canal que el update
- Asegúrate de que el `runtimeVersion` sea compatible
- Reinicia la app completamente (cierra y abre de nuevo)

### Cambios nativos no se reflejan
- Los cambios en `eas.json`, plugins, o código nativo requieren un nuevo build
- Ejecuta `eas build` nuevamente y distribuye el nuevo build

## Cambios que Requieren un Nuevo Build

Necesitarás crear un nuevo build cuando cambies:

- Plugins de Expo (`app.config.js` > `plugins`)
- Configuración de `eas.json`
- Versión de la app
- Código nativo (iOS/Android)
- Permisos nativos
- Dependencias que incluyen código nativo

## Cambios que Solo Requieren un Update

Puedes usar updates para:

- Cambios en código JavaScript/TypeScript
- Componentes de React
- Estilos y diseño
- Assets (imágenes, fuentes, etc.)
- Lógica de negocio
- Corrección de bugs en código JS

## Recursos Adicionales

- [Documentación de EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [GitHub Actions con EAS](https://docs.expo.dev/eas-update/github-actions/)
- [Runtime Versions](https://docs.expo.dev/eas-update/runtime-versions/)
