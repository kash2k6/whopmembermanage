# Member Upgrade Management

A Whop B2B app that automatically cancels lower-tier memberships when users upgrade to higher plans within the same product, preventing double-charging.

## Features

- **Automatic Upgrade Detection**: Listens for membership activations via webhooks
- **Rule-Based Configuration**: Define which plans count as upgrades per product
- **Price-Based Logic**: Default upgrade detection based on plan pricing
- **Activity Logging**: Track all upgrade actions and cancellations
- **Clean Dashboard**: Single-page interface for easy rule configuration

## Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment variables**:
   - Copy `.env.development` to `.env.local`
   - Fill in your Whop App credentials:
     - `NEXT_PUBLIC_WHOP_APP_ID`
     - `WHOP_API_KEY`
     - `WHOP_WEBHOOK_SECRET`
     - `WHOP_AGENT_USER_ID`
   - Fill in your Supabase credentials:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`

3. **Set up Supabase database**:
   - Create a new Supabase project
   - Run the migration in `supabase/migrations/001_initial_schema.sql`

4. **Configure Whop App**:
   - In your Whop Developer Dashboard, set:
     - Base URL: Your deployment domain
     - App path: `/experiences/[experienceId]`
     - Dashboard path: `/dashboard/[companyId]`
     - Webhook URL: `https://your-domain.com/api/webhooks/membership-activated`
     - Webhook events: `membership.activated`

5. **Run development server**:
   ```bash
   pnpm dev
   ```

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── products/          # Fetch products
│   │   ├── plans/             # Fetch plans
│   │   ├── rules/             # CRUD for upgrade rules
│   │   ├── activity/           # Activity logs
│   │   └── webhooks/           # Webhook handlers
│   ├── dashboard/              # Dashboard pages
│   └── layout.tsx              # Root layout
├── components/
│   └── dashboard/             # Dashboard components
├── lib/
│   ├── whop/                  # Whop API client
│   ├── db/                    # Database client & schema
│   └── services/              # Business logic
└── supabase/
    └── migrations/            # Database migrations
```

## Design System

- **Primary Color**: Orange (#FF7A1A)
- **Accent**: Soft amber (#FFB26B)
- **Background**: Near-white (#FAFAFA)
- **Surface**: White (#FFFFFF)
- **Border**: Light gray (#EDEDED)
- **Rounded Corners**: 12px
- **Shadows**: Subtle (0 8px 24px rgba(0,0,0,0.04))
- **Transitions**: 150-200ms ease

## Deployment

1. Push to GitHub
2. Deploy to Vercel
3. Add environment variables in Vercel dashboard
4. Update webhook URL in Whop Developer Dashboard

## License

Private - Whop App
