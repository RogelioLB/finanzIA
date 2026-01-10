# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**FinanzIA** is a personal finance management mobile app built with React Native and Expo. It features multi-wallet management, transaction tracking, subscription handling, and AI-powered financial planning via OpenAI.

## Development Commands

```bash
npm install              # Install dependencies
npm start                # Start Expo dev server
npm run dev              # Start with development variant (APP_VARIANT=development)
npm run android          # Build and run on Android
npm run ios              # Build and run on iOS
npm run web              # Start web dev server
npm run lint             # Run ESLint
```

## Architecture

### Tech Stack
- **Framework**: React Native 0.79.6 + Expo 53
- **Routing**: Expo Router (file-based routing in `app/`)
- **Styling**: NativeWind (Tailwind CSS)
- **Database**: Expo SQLite with versioned migrations
- **State**: React Context API
- **AI**: Vercel AI SDK + OpenAI gpt-4o-mini

### Directory Structure
- `app/` - Routes and screens (Expo Router file-based)
- `app/(tabs)/` - Main tab navigation screens
- `app/api/` - API routes (e.g., `generate-plan+api.ts` for OpenAI)
- `contexts/` - React Context providers (Wallets, Transactions, Categories, AddTransaction, Notifications)
- `components/` - Reusable UI components
- `components/views/` - Feature-specific view components
- `hooks/` - Custom React hooks
- `lib/database/` - SQLite schema and service
- `constants/` - Colors and app constants

### State Management Pattern
Each domain has a Context provider with a corresponding hook:
- `WalletsContext.tsx` → `useWallets()`
- `TransactionsContext.tsx` → `useTransactions()`
- `CategoriesContext.tsx` → `useCategories()`
- `AddTransactionContext.tsx` → `useAddTransaction()`

**Important**: Always call `refreshTransactions()` or `refreshWallets()` after database mutations.

### Database Schema (lib/database/initDatabase.ts)
Current version: 8. Key tables:
- **wallets** - User accounts with balance, currency, icon, color
- **categories** - Expense/income categories (pre-loaded in Spanish)
- **transactions** - Income/expense/transfer records with subscription support
- **budgets** / **category_budget_limits** - Budget tracking
- **objectives** - Financial goals (savings/debt)
- **labels** / **transaction_labels** - Transaction tagging

### Transaction Types
- `income` / `expense` - Standard transactions
- `transfer` - Between wallets (uses `to_wallet_id`)
- Subscriptions: Set `is_subscription=1` with `subscription_frequency` (daily/weekly/monthly/yearly)
- `is_excluded` flag: Excludes from AI analysis

### Multi-Currency
Each wallet has its own currency. Balance aggregation groups by currency using `Intl.NumberFormat`.

### Build Variants (app.config.js)
- **Development**: `npm run dev` - Shows "FinanzIA (Dev)", uses `com.finanzia.dev`
- **Production**: Default - Uses `com.finanzia`

## AI Financial Planning Setup

1. Create `.env.local` with `OPENAI_API_KEY=sk-your-key`
2. Requires minimum 10 transactions to generate plan
3. Endpoint: `POST /api/generate-plan+api`

See `AI_PLAN_SETUP.md` for detailed setup instructions.

## Key Conventions

- **Timestamps**: Stored as milliseconds since epoch
- **UUIDs**: Generated via react-native-uuid for all entities
- **Database functions**: Follow `get*()`, `create*()`, `update*()`, `delete*()` pattern in `sqliteService.ts`
- **UI Language**: Spanish (category names, labels, UI text)
