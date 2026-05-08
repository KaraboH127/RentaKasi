# RentaKasi

RentaKasi is a production-ready React/Vite application for township room rentals. The frontend talks directly to Supabase for authentication, listings, profiles, listing images, and storage.

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth, Database, and Storage
- npm
- Vercel-compatible static deployment

## Getting Started

```bash
npm install
npm run dev
```

## Environment

The app expects these Vite variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Supabase Setup

Run `supabase-schema.sql` in the Supabase SQL Editor. It creates:

- `profiles`
- `listings`
- `listing_images`
- RLS policies
- updated_at triggers
- `listing-images` storage bucket policies

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Deployment

Deploy the repository to Vercel with the build command `npm run build` and output directory `dist`.
