# Frontend Local Setup

Run the Django backend first. The frontend proxies API requests to the backend URL from `DJANGO_API_URL`.

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env.local
```

For local development, keep:

```bash
DJANGO_API_URL=http://127.0.0.1:8000
```

## 3. Start The Frontend

```bash
npm run dev
```

Open `http://localhost:3000`.

## Optional Production Check

```bash
npm run build
npm run start
```
