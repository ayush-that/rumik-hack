# Cyrux Template

Next.js 16 application with Convex backend, better-auth authentication, and shadcn/ui components.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS 4
- **Backend**: Convex
- **Authentication**: better-auth with @convex-dev/better-auth
- **UI Components**: shadcn, Radix UI, lucide-react
- **Email**: React Email

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
pnpm install
```

### Development

Run both Next.js and Convex dev servers:

```bash
pnpm dev
```

Or run separately:

```bash
pnpm dev:web   # Next.js only
pnpm dev:convex # Convex only
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

## Project Structure

```
app/
├── (auth)/          # Authentication routes (sign-in, sign-up)
├── (dashboard)/    # Protected dashboard routes
├── (public)/       # Public routes (landing, about, terms, privacy)
├── api/            # API routes
└── globals.css     # Global styles

convex/
├── auth.ts         # Authentication handlers
├── schema.ts       # Database schema
├── user.ts         # User-related queries/mutations
├── payments.ts     # Payment logic
├── dodo.ts         # Dodopayments integration
└── webhooks.ts    # Webhook handlers
```

## Features

- Email/password authentication via better-auth
- Dashboard with billing page
- Dodo payments integration
- Email templates via React Email