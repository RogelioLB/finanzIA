# Build Variants Configuration

## Changes Made

### 1. Migrated from app.json to app.config.js

- Created `app.config.js` with dynamic configuration based on `APP_VARIANT` environment variable
- The configuration now supports two variants:
  - **Development**: `Finance App (Dev)` with bundle ID `com.financeapp.dev`
  - **Production**: `Finance App` with bundle ID `com.financeapp`

### 2. Updated EAS Build Configuration

- Modified `eas.json` to set `APP_VARIANT=development` for development builds
- Production builds run without the environment variable (default production variant)

### 3. Added Development Script

- Added `dev` script to `package.json` that sets `APP_VARIANT=development`
- Installed `cross-env` for cross-platform environment variable support

## Usage

### Development Server

Run the development server with the development variant:

```bash
pnpm dev
```

Or manually:

```bash
cross-env APP_VARIANT=development expo start
```

### Building with EAS

**Development Build:**
```bash
eas build --profile development
```
This will create a build with:
- App name: "Finance App (Dev)"
- iOS Bundle ID: `com.financeapp.dev`
- Android Package: `com.financeapp.dev`

**Production Build:**
```bash
eas build --profile production
```
This will create a build with:
- App name: "Finance App"
- iOS Bundle ID: `com.financeapp`
- Android Package: `com.financeapp`

### Preview Build

```bash
eas build --profile preview
```

## Benefits

- Install both development and production versions on the same device
- Separate bundle identifiers prevent conflicts
- Easy switching between variants during development
- The `expo-dev-client` scheme is only added to development builds

## Next Steps

You can now delete the old `app.json` file as it's no longer needed. The configuration is now managed by `app.config.js`.
