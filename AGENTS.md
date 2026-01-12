# AGENTS.md

This document provides essential information for AI agents (like Claude Code, Cursor, or Copilot) working on the **FinanzIA** codebase.

## Project Overview
**FinanzIA** is a personal finance mobile application built with React Native and Expo. Key features include multi-wallet management, transaction tracking (with recurring subscriptions), AI-powered financial analysis/planning, and a specialized chat interface for financial advice.

## Development & Build Commands

### Setup & Development
- `npm install` - Install dependencies.
- `npm start` - Start Expo development server (interactive).
- `npm run dev` - Start development variant (`APP_VARIANT=development`).
- `npm run android` - Build/run on Android emulator or connected device.
- `npm run ios` - Build/run on iOS simulator or connected device.

### Quality Control
- `npm run lint` - Run ESLint checks (uses `eslint-config-expo`).
- `npx tsc --noEmit` - Run TypeScript type checks across the project.

### Testing
*Note: A formal test suite is not currently configured in `package.json`. If implementing tests (recommended via Jest):*
- `npx jest` - Run all tests.
- `npx jest path/to/file.test.ts` - Run a specific test file.
- `npx jest -t 'pattern'` - Run tests matching a name pattern.

## Project Structure
- `app/` - Expo Router file-based navigation.
  - `app/(tabs)/` - Main tab navigation screens (Home, Accounts, AI Plan, Statistics, More).
  - `app/api/` - Serverless API routes (e.g., chat, generate-plan).
- `components/` - Reusable UI components.
  - `components/chat/` - Chat UI components (bubbles, inputs, charts, tables).
  - `components/views/` - Complex feature-specific UI (wallet info, forms).
- `contexts/` - React Context providers for global state (Wallets, Transactions, Objectives, Notifications).
- `lib/`
  - `lib/database/` - SQLite configuration (`sqliteService.ts`, schema).
  - `lib/chat/` - AI-related logic (context builders, message parsers).
- `hooks/` - Custom React hooks (e.g., `useWallets`).
- `constants/` - Global constants (Colors, Currencies, layout).
- `utils/` - Shared helper functions (formatting, validation, dates).

## Code Style & Guidelines

### 1. Naming Conventions
- **Files**: `kebab-case.ts` for logic/hooks, `PascalCase.tsx` for components.
- **Variables & Functions**: `camelCase`.
- **Interfaces & Types**: `PascalCase`. Do **not** prefix with `I`.
- **Database Schema**: `snake_case` for columns (e.g., `wallet_id`, `is_subscription`).
- **Language**:
  - **Code**: Variables, functions, types, and file names must be in **English**.
  - **UI & Logic Comments**: Text shown to users and comments explaining business rules should be in **Spanish**.

### 2. TypeScript & Data Models
- **Strict Typing**: Avoid `any`. Define interfaces for all data models.
- **Entity IDs**: Always use UUIDs (`react-native-uuid`) for database IDs.
- **Union Types**: Prefer string unions over enums (e.g., `role: 'user' | 'assistant'`).
- **Models**: Refer to `lib/database/sqliteService.ts` for core types: `Wallet`, `Transaction`, `Category`, `Objective`.

### 3. Imports
- Use **path aliases** for all imports: `@/components`, `@/lib`, `@/contexts`, etc.
- **Standard Order**:
  1. React/React Native core.
  2. Expo libraries.
  3. Third-party libraries.
  4. Contexts & Hooks.
  5. Components.
  6. Utils & Constants.

### 4. Components & Styling
- **Functional Components**: Use functional components with hooks exclusively.
- **Styling**: Use **NativeWind** (Tailwind CSS for React Native) via `className`.
- **Icons**: Use `@expo/vector-icons` (prefer `Ionicons` or `MaterialCommunityIcons`).
- **Layout**: Use `SafeAreaView` from `react-native-safe-area-context` to handle notches.

### 5. State Management & Data Flow
- **Context API**: Access data via context hooks (`useWallets`, `useTransactions`). Do not drill props for shared state.
- **Data Refresh**: After a DB mutation (Create/Update/Delete), you **MUST** call the corresponding refresh function from the context (e.g., `refreshWallets()`) to sync the UI.
- **Timestamps**: All dates in the DB and state are stored as **milliseconds since epoch** (`number`).

### 6. Database Patterns
- **Access**: Use the `useSQLiteService()` hook for all SQLite operations.
- **Transactions**: Use `db.withTransactionAsync` for multi-step operations to ensure atomicity.
- **Filtering**: Most list views should support date range and category filtering.

### 7. AI & Chat Integration
- **Response Format**: AI responses use special markers parsed by `lib/chat/messageParser.ts`:
  - `[CHART:PIE:JSON]` - Renders a pie chart.
  - `[CHART:BAR:JSON]` - Renders a bar chart.
  - `[TABLE:JSON]` - Renders a data table.
  - `[ACTION:SAVE_OBJECTIVE:JSON]` - Renders a button to save a plan as an objective.
- **Context Building**: Refer to `lib/chat/contextBuilder.ts` to see how financial data is summarized for the LLM.

### 8. Error Handling
- **Async Operations**: Wrap all database, API, and network calls in `try/catch`.
- **Logging**: Use descriptive tags: `console.error("[Service:Wallet] Failed to create:", error)`.
- **User Feedback**: Use the `Toast` utility from `toastify-react-native` for errors and success messages.

## Security
- **Sensitive Files**: `.env` and `.env.local` are ignored by Git. Never log API keys.
- **Exclusion**: Use the `is_excluded` flag in transactions for data that should be hidden from AI processing or net balance calculations.
- **PII**: Avoid logging or sending unencrypted personal identifiers beyond the minimal financial context required.
