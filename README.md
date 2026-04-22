# The Tomb Video - Headless Shopify Storefront

A Next.js + Tailwind storefront for a horror and sci-fi physical media brand, powered by Shopify Storefront API for products and checkout.

## Stack

- Next.js App Router (TypeScript)
- Tailwind CSS v4
- Shopify Storefront GraphQL API
- Netlify-ready deployment model

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create local environment variables:

```bash
copy .env.example .env.local
```

3. Fill in Shopify credentials in `.env.local`:

- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- `NEXT_PUBLIC_SITE_URL`

Example:

```env
SHOPIFY_STORE_DOMAIN=the-tomb-video.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=replace-with-your-storefront-token
NEXT_PUBLIC_SITE_URL=https://the-tomb-video.myshopify.com
```

4. Start development:

```bash
npm run dev
```

5. Production checks:

```bash
npm run lint
npm run build
```

## Prelaunch Hosting (Netlify)

1. Push this repo to GitHub.
2. Create a Netlify site from the repo.
3. Netlify build settings:

- Build command: `npm run build`
- Node version: `20`

4. Add environment variables in Netlify site settings:

- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (optional in tokenless mode)
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SHOW_PLACEHOLDER_RACK` (`false` in production)

5. Connect your custom domain to Netlify and use that as the public storefront URL.

`netlify.toml` is included so this is ready before launch day.

## Launch Playbook (Guided)

Use this sequence to go live quickly.

### 1) Agent-Run Preflight (local)

```bash
npm run preflight
```

This runs lint, production build, and targeted smoke tests.

### 2) User Actions (account-bound)

1. Push repo to GitHub.
2. Netlify -> Add new site -> Import from Git -> select this repo.
3. Build settings:
	- Build command: `npm run build`
	- Publish directory: `.next`
4. Netlify -> Site configuration -> Environment variables:
	- `SHOPIFY_STORE_DOMAIN=the-tomb-video.myshopify.com`
	- `SHOPIFY_STOREFRONT_ACCESS_TOKEN=<your_token>`
	- `NEXT_PUBLIC_SITE_URL=https://shop.yourdomain.com`
5. Netlify -> Domain management -> Add custom domain (`shop.yourdomain.com`).
6. In your DNS provider, create:
	- `CNAME shop -> <your-netlify-site>.netlify.app`
7. Back in Netlify Domain management:
	- verify domain
	- enable HTTPS
	- force HTTPS

### 3) Post-Deploy Verification

1. Open `https://shop.yourdomain.com` and verify home, tag pages, product pages, and cart.
2. Confirm Shopify checkout opens from cart.
3. Confirm robots and sitemap are accessible:
	- `/robots.txt`
	- `/sitemap.xml`

### 4) Notes About Shopify Domain

- `the-tomb-video.myshopify.com` serves Shopify-hosted storefront themes only.
- This headless Next.js storefront should live on your custom domain/subdomain (for example `shop.yourdomain.com`).

## Current Storefront Features

- Product fetch from Shopify (catalog page)
- Catalog filters (search + format)
- Product detail page by handle
- Collection index page and collection detail pages
- Client-side local cart state
- Shopify cart create and line add through API route
- Redirect flow to Shopify hosted checkout
- Branded horror-inspired UI baseline
- Preview-only placeholder sale rack (for visual merchandising tests)
- Product JSON-LD plus sitemap and robots metadata routes

## Project Shape

- `src/lib/shopify/*`: GraphQL queries, types, API client, operations
- `src/app/api/cart/route.ts`: Cart API bridge to Shopify
- `src/app/page.tsx`: Catalog landing page
- `src/app/products/[handle]/page.tsx`: Product detail route
- `src/app/cart/page.tsx`: Cart page and checkout handoff
- `src/components/*`: Shared UI and cart provider

## Notes On Production Behavior

- The home page gracefully shows a config warning if Shopify environment variables are missing.
- Catalog data uses ISR-style caching (`revalidate = 120`) for speed and fresh stock updates.
- Cart API uses `no-store` for immediate checkout consistency.

## Practical Next Steps

1. Replace placeholder branding copy with real category and condition language.
2. Add collection thumbnails and featured hero visuals.
3. Add analytics and session replay before paid traffic campaigns.
4. Add inventory-aware merchandising (restock badges, low-stock labels).

## SEO + Performance Checklist

- Product JSON-LD structured data is implemented on detail pages.
- Sitemap and robots routes are implemented (including dynamic product and collection URLs).
- Add dynamic OG image generation for social sharing.
- Use Shopify image transform params to ship smaller source images.
- Keep above-the-fold copy text-first for quick paint and stronger crawlability.
- Add canonical URLs once your final branded domain is live.
