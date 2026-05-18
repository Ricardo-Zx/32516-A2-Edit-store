# H&M Curated — 32516 Assignment 2

A single-page H&M-style fashion store. Customers browse a real H&M catalog, filter and search in real-time, sign up, fill a shopping bag, and check out. Admins manage products and inspect every user's bag and activity feed.

## Tech stack

| Layer       | Choice                                                    |
| ----------- | --------------------------------------------------------- |
| Frontend    | React 18, Vite, Material UI 6, framer-motion, React Router |
| Backend     | FastAPI, Motor (async MongoDB driver), Pydantic v2         |
| Database    | MongoDB Atlas (free M0 cluster)                            |
| Auth        | JWT (HS256) + bcrypt password hashing                      |
| Data        | H&M Personalized Fashion Recommendations (Kaggle)          |

## Features

- **JWT authentication** — register, login, bcrypt-hashed passwords, role-based access (`user` / `admin`).
- **Live product search** — debounced search bar filters by name, color, type, or description without page reload.
- **Category browsing** — chips drive filters and deep-linkable URLs (`/shop?category=...`).
- **Product detail** — full description, live stock, quantity picker, add-to-bag.
- **Shopping bag** — quantity controls, subtotal, remove, clear, and real checkout.
- **Orders** — users can place orders, view order history, and track fulfilment status.
- **Profile** — signed-in users can review account details and change password.
- **Admin dashboard** — four tabs:
  - **Users** — view every account.
  - **Carts** — every user's current bag and totals.
  - **Activity** — login / register / cart actions feed.
  - **Orders** — inspect all orders and update status (`placed`, `processing`, `shipped`, `cancelled`).
  - **Products** — full CRUD with create/edit/delete dialogs.
- **Admin overview** — total users, products, orders, revenue, status mix, and top-selling products.
- **SPA UX** — one `index.html`; everything else is client-side routing with animated transitions.

## Entities (three required for the assignment)

1. **User** — `users` collection (email, hashed password, role, timestamps).
2. **Product** — `products` collection (name, category, color, price, image, stock).
3. **Cart** — `carts` collection (one per user, embedded items array).
4. **Order** — `orders` collection (immutable order snapshots with status).
5. **UserActivity** — bonus `user_activity` collection for the admin feed.

## Folder structure

```
A2/
├── backend/
│   ├── app/
│   │   ├── routers/        # auth, products, cart, orders, admin
│   │   ├── config.py       # pydantic-settings reading ../.env
│   │   ├── database.py     # Motor client + lifespan hooks
│   │   ├── deps.py         # JWT dependencies, ObjectId guard
│   │   ├── main.py         # FastAPI app + CORS + static mount
│   │   ├── schemas.py      # Pydantic request/response models
│   │   └── security.py     # bcrypt + JWT helpers
│   ├── static/images/      # seeded product images served at /static/images/*
│   ├── seed.py             # populates MongoDB with products + demo users
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Footer, ProductCard
│   │   ├── context/        # AuthContext, CartContext, ToastContext
│   │   ├── pages/          # Home, Products, ProductDetail, Cart, Orders, Profile, Login, Register, Admin
│   │   ├── App.jsx         # routes + guards
│   │   ├── api.js          # axios instance with token interceptor
│   │   ├── main.jsx        # ThemeProvider + providers
│   │   └── theme.js        # editorial fashion theme
│   ├── index.html
│   ├── package.json
│   └── vite.config.js      # /api + /static proxies to FastAPI
├── data/
│   ├── raw/                # Kaggle source (gitignored, ~2 GB)
│   └── sample/             # 250 cleaned products + images used by seed.py
├── scripts/
│   ├── download_hm.sh      # downloads the Kaggle dataset
│   └── build_sample.py     # picks 25 products per category and copies images
├── .env.example
├── .gitignore
└── README.md
```

## Running locally

### 1. Prerequisites

- Python 3.11+, Node.js 18+, npm
- A MongoDB Atlas free cluster (or local mongod)
- Kaggle account with API token (for the dataset download only)

### 2. Configuration

Copy `.env.example` to `.env` and fill in your values:

```
MONGODB_URL=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
MONGODB_DB=hm_store
JWT_SECRET=<a long random string>
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 3. Get the data (one-time)

```bash
# scripts/download_hm.sh uses Kaggle CLI; ensure ~/.kaggle/access_token is set
bash scripts/download_hm.sh
python scripts/build_sample.py
```

This creates `data/sample/products.json` and `data/sample/images/` (250 items).

### 4. Backend

```bash
pip install -r backend/requirements.txt
python backend/seed.py          # one-time: seed MongoDB + copy images
cd backend && uvicorn app.main:app --reload --port 8000
```

API docs: <http://127.0.0.1:8000/docs>

### 5. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

### 6. Demo accounts

| Role  | Email                | Password   |
| ----- | -------------------- | ---------- |
| Admin | admin@example.com    | Admin@123  |
| User  | demo@example.com     | Demo@123   |

## API reference (essentials)

| Method | Path                          | Auth   | Purpose                                  |
| ------ | ----------------------------- | ------ | ---------------------------------------- |
| POST   | `/api/auth/register`          | —      | Create account, returns JWT              |
| POST   | `/api/auth/login`             | —      | Sign in, returns JWT                     |
| GET    | `/api/auth/me`                | user   | Current user profile                     |
| PUT    | `/api/auth/password`          | user   | Change current user's password           |
| GET    | `/api/products?q=&category=`  | —      | List/search products                     |
| GET    | `/api/products/categories`    | —      | Distinct categories                      |
| POST   | `/api/products`               | admin  | Create product                           |
| PUT    | `/api/products/{id}`          | admin  | Update product                           |
| DELETE | `/api/products/{id}`          | admin  | Delete product (also pruned from carts)  |
| GET    | `/api/cart`                   | user   | Current user's cart                      |
| POST   | `/api/cart/items`             | user   | Add to cart                              |
| PUT    | `/api/cart/items/{id}`        | user   | Update qty (qty=0 removes)               |
| DELETE | `/api/cart/items/{id}`        | user   | Remove item                              |
| DELETE | `/api/cart`                   | user   | Clear cart                               |
| POST   | `/api/orders`                 | user   | Checkout cart into a real order          |
| GET    | `/api/orders`                 | user   | Current user's order history             |
| GET    | `/api/admin/stats`            | admin  | Store overview metrics                   |
| GET    | `/api/admin/users`            | admin  | All users                                |
| GET    | `/api/admin/carts`            | admin  | All users' carts                         |
| GET    | `/api/admin/orders`           | admin  | All orders                               |
| PUT    | `/api/admin/orders/{id}`      | admin  | Update order status                      |
| GET    | `/api/admin/activity`         | admin  | Recent activity feed                     |

## Workload allocation

Record the exact group composition in this section before submitting. The file ownership below is the format used by this project and should match the contributors shown in your public GitHub history.

| Member | Responsibilities | Key files |
| ------ | ---------------- | --------- |
| Yuchang Zhang | Backend architecture, FastAPI routes, MongoDB schema, JWT auth, admin endpoints, data pipeline | `backend/app/**`, `backend/seed.py`, `scripts/build_sample.py` |
| Frontend owner (replace with actual teammate name, or delete this row for an individual submission) | React SPA, MUI theme, page components, client-side state, UX polish | `frontend/src/**` |

If you have a third member, add another row with their name plus the exact files or folders they contributed.

## Notes

- `data/raw/` and `backend/static/images/` are git-ignored: the raw dataset is too large for GitHub. Anyone cloning the repo runs the two scripts in step 3 to regenerate them.
- Image filenames are real H&M article ids (e.g. `0108775015.jpg`). Images are © H&M and used here strictly for an academic, non-commercial demonstration.
- No credentials are committed; everything is read from `.env`, which is gitignored.
- Before publishing the repository, confirm `.env` is not tracked, the commit history shows incremental work, and the final group-member names in the table above match the actual contributors.
