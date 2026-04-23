# Mõ Sushi

A modern sushi ordering web app built with Next.js, TypeScript, Tailwind CSS, and the App Router.

## Features

- Responsive sushi menu page with product cards
- Product card includes image, name, price, and ingredients
- Add/remove quantity controls directly from menu cards
- Dedicated cart page with:
  - all picked items
  - per-item quantity controls (`-` / `+`)
  - per-item line total (`price x quantity`)
  - overall order total
  - `Complete order` button (UI ready)
- Cart state persisted in `localStorage`

## Tech Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- ESLint

## Pages

- `/` - landing page
- `/menu` - sushi menu and quick cart summary
- `/cart` - editable cart with total price

## Project Structure

```text
app/
  page.tsx            # Landing page
  menu/page.tsx       # Menu page
  cart/page.tsx       # Cart page
  layout.tsx
  globals.css
components/
  SushiMenuCard.tsx
data/
  sushiMenu.ts
lib/
  cart.ts             # localStorage read/write helpers
public/sushi/
  *.svg               # Sushi images
```

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - build for production
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Cart Persistence

Cart data is stored in browser `localStorage` under the key:

`mo-sushi-cart`

This means cart contents persist across page reloads in the same browser.

## Notes

- This project currently uses client-side cart storage only (no backend/database).
- `Complete order` is currently a UI button and not yet connected to an API.
