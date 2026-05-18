# Nutrition Hub Bangladesh Fresh

Fresh full-stack e-commerce build for a premium supplement reseller in Bangladesh.

## Stack

- Frontend: Next.js, Tailwind CSS, Framer Motion, GSAP
- Backend: FastAPI, SQLAlchemy
- Database: PostgreSQL
- CMS: custom Next.js admin shell backed by FastAPI APIs

## Structure

- `frontend/` - public storefront and CMS admin UI
- `backend/` - FastAPI API for products and orders
- `docker-compose.yml` - local PostgreSQL service
- `assets/` - original generated design assets

## Local setup

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
cd ..
docker compose up -d postgres
uvicorn app.main:app --reload --app-dir backend
```

Open:

- Storefront: `http://localhost:3000`
- CMS shell: `http://localhost:3000/admin/products`
- API health: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

## Performance target

To support 1000 concurrent users:

- Cache public product/category pages through Next.js static rendering or ISR.
- Serve images through Cloudinary, S3 + CloudFront, or another CDN-backed image service.
- Keep checkout and CMS traffic on FastAPI, separate from cached browsing traffic.
- Add PostgreSQL indexes for product slug, category, status, SKU, order phone, and created date.
- Add Redis later for hot catalog reads, session state, rate limiting, and order queueing.
- Deploy behind Cloudflare with Brotli/Gzip, HTTP/2 or HTTP/3, and long-lived static asset cache headers.

## Current implementation

- Cinematic GSAP hero reveal.
- Framer Motion section and product reveals.
- Premium product grid using local catalog data.
- CMS product-management shell.
- FastAPI product create/list/update endpoints.
- FastAPI order creation with stock checks.
- PostgreSQL models for categories, products, orders, and order items.
