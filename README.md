# 📦 Depot — Inventory Management System

> A production-grade inventory control system for Indian retail, built and deployed in a single day as a DevOps-focused engineering project.

**Live Demo →** http://ec2-65-0-96-101.ap-south-1.compute.amazonaws.com/
**Credentials →** `admin` / `admin123`  
**GitHub →** https://github.com/PrasannaKrishna0307/inventory-app

---

## 🎯 Purpose & Problem Statement

Small Indian retailers — kirana stores, wholesale distributors, and warehouse operators — typically manage inventory through spreadsheets or paper ledgers. These methods break down at scale: stock discrepancies, missed reorder alerts, and zero visibility into revenue trends are common pain points.

**Depot** solves this by providing a lightweight, real-time inventory control system that tracks products, stock movements, and sales in one place — with automated low-stock alerts and a live revenue dashboard.

---

## 💡 Project Impact

| Without Depot | With Depot |
|---|---|
| Stock counted manually, errors common | Real-time quantity tracking on every sale |
| No reorder alerts — items run out unexpectedly | Automated low-stock alerts with configurable thresholds |
| Revenue tracked in separate spreadsheet | Live dashboard with gross revenue and transaction count |
| No audit trail for stock movements | Full sales ledger and stock history log |
| Deployment takes days of config | Containerized — deployable in under 10 minutes |

The system was seeded with **990 real grocery products** from a public Kaggle dataset (localized to Indian names, INR prices, and Indian warehouse locations), simulating a realistic production inventory at a mid-size retail distributor.

---

## 🛠️ Tech Stack

| Layer | Technology | Reason for Choice |
|---|---|---|
| **Backend** | Node.js + Express | Lightweight, fast to scaffold, huge ecosystem. Single language (JS) across the full stack. |
| **Database** | SQLite (via better-sqlite3) | Zero-config, file-based, ACID-compliant. No separate DB server to manage. Perfect for single-instance deployments. |
| **Frontend** | Vanilla HTML + CSS + JS | No build step, no framework overhead. Served directly by Express — one container, one deployment unit. |
| **Auth** | JWT + bcryptjs | Stateless authentication. No session storage needed. bcrypt provides salt-based password hashing. |
| **Container** | Docker + Docker Compose | Reproducible environment. Eliminates "works on my machine" problems. |
| **Cloud** | AWS EC2 (t3.micro, Mumbai region) | Full control over the server environment. Free-tier eligible. Industry-standard IaaS. |
| **CI/CD** | GitHub Actions | Auto-deploys to EC2 on every push to main. Zero manual intervention after setup. |
| **Dataset** | Kaggle Grocery Inventory Dataset | 990 real product rows. Localized to Indian product names, INR pricing, and Indian warehouse locations. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                             │
│                                                                     │
│   index.html  ←  Vanilla JS fetch() API calls                      │
│   JWT stored in localStorage                                        │
│   Authorization: Bearer <token> on every request                   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │  HTTP (port 80)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│              AWS EC2  t3.micro  —  ap-south-1 (Mumbai)              │
│              Ubuntu 22.04 LTS                                       │
│              Security Group: 22 (SSH), 80 (HTTP)                   │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │           Docker Container  (depot-app)                       │  │
│  │                                                               │  │
│  │   Node.js 20 + Express                                        │  │
│  │   ├── Static middleware  →  serves index.html                 │  │
│  │   ├── CORS middleware                                         │  │
│  │   ├── JSON body parser                                        │  │
│  │   ├── JWT auth middleware  →  protects /api/* routes          │  │
│  │   └── Route handlers:                                         │  │
│  │       POST  /api/auth/login                                   │  │
│  │       GET   /api/products                                     │  │
│  │       POST  /api/products                                     │  │
│  │       DELETE/api/products/:id                                 │  │
│  │       POST  /api/stock/in                                     │  │
│  │       GET   /api/sales                                        │  │
│  │       POST  /api/sales   ← atomic transaction                 │  │
│  │       GET   /api/dashboard                                    │  │
│  │                                                               │  │
│  │   better-sqlite3 driver (synchronous, in-process)             │  │
│  │            │                                                  │  │
│  │            ▼                                                  │  │
│  │   inventory.db  (mounted from host via Docker volume)         │  │
│  │   ├── users          (id, username, password_hash)            │  │
│  │   ├── products       (id, name, sku, price, qty, threshold,   │  │
│  │   │                   category, supplier, location, status)   │  │
│  │   ├── sales          (id, product_id, quantity, total, ts)    │  │
│  │   └── stock_history  (id, product_id, quantity, type, ts)     │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                            ▲
                            │  SSH → git pull → docker-compose up --build
                            │
┌─────────────────────────────────────────────────────────────────────┐
│             GitHub Actions  (.github/workflows/deploy.yml)          │
│                                                                     │
│   Trigger:  push to main                                            │
│   Steps:                                                            │
│     1. Checkout code                                                │
│     2. SSH into EC2 (appleboy/ssh-action)                           │
│     3. git pull origin main                                         │
│     4. docker-compose down                                          │
│     5. docker-compose up -d --build                                 │
│     6. docker image prune -f                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle (Sale Creation)

```
Browser                Express              SQLite
  │                       │                   │
  │── POST /api/sales ────▶│                   │
  │   {product_id, qty}    │                   │
  │                        │── verify JWT      │
  │                        │── SELECT product ─▶│
  │                        │◀─ product row ────│
  │                        │                   │
  │                        │── BEGIN TXN ──────▶│
  │                        │── INSERT sale ────▶│
  │                        │── UPDATE qty-=n ──▶│
  │                        │── INSERT history ─▶│
  │                        │── COMMIT ─────────▶│
  │                        │◀─ success ─────────│
  │◀── {success, total} ───│                   │
```

---

## ✨ Features

- 🔐 **JWT authentication** — stateless, 24h token expiry, bcrypt password hashing
- 📦 **Product catalog** — 990 SKUs with category, supplier, warehouse location
- 📥 **Stock receiving** — record incoming inventory from suppliers
- 💰 **Point of sale** — create sales with automatic stock deduction via DB transaction
- 📊 **Live dashboard** — KPIs, low-stock alerts, top sellers, category breakdown
- 🔍 **Search + filter** — by name, SKU, or category with pagination (25/page)
- ⚠️ **Reorder alerts** — configurable threshold per product
- 🐳 **Fully containerized** — Docker + Compose, runs identically everywhere
- 🔄 **CI/CD pipeline** — auto-deploys on every push to main

---

## 🚀 Running Locally

### Prerequisites
- Node.js 20+
- Docker Desktop

### Option 1: Direct Node

```bash
git clone https://github.com/PrasannaKrishna0307/inventory-app.git
cd inventory-app/backend
npm install
node seed.js          # imports 990 products from data/inventory.csv
node server.js        # starts on http://localhost:3000
```

### Option 2: Docker Compose

```bash
git clone https://github.com/PrasannaKrishna0307/inventory-app.git
cd inventory-app/backend
node seed.js          # run once to generate inventory.db
cd ..
docker-compose up --build
# Visit http://localhost
```

**Login:** `admin` / `admin123`

---

## ☁️ Production Deployment (EC2)

### First-time setup

```bash
# SSH into EC2
ssh -i "inventory-app-key.pem" ubuntu@<EC2_IP>

# Install Docker
sudo apt update && sudo apt install -y docker.io docker-compose git
sudo usermod -aG docker ubuntu && newgrp docker

# Clone and seed
git clone https://github.com/PrasannaKrishna0307/inventory-app.git
cd inventory-app/backend
node seed.js

# Start
cd ~/inventory-app
docker-compose up -d --build
```

### CI/CD Setup (GitHub Actions)

Add these secrets in your repo → Settings → Secrets → Actions:

| Secret | Value |
|---|---|
| `EC2_HOST` | Your EC2 public IP |
| `EC2_USERNAME` | `ubuntu` |
| `EC2_SSH_KEY` | Full contents of your `.pem` file |

After this, every `git push origin main` auto-deploys to EC2. ✅

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/products` | Yes | List products (supports `?category=`, `?search=`) |
| POST | `/api/products` | Yes | Add new product |
| DELETE | `/api/products/:id` | Yes | Delete product |
| GET | `/api/products/categories` | Yes | List all categories |
| POST | `/api/stock/in` | Yes | Record stock receipt |
| POST | `/api/sales` | Yes | Create sale (atomic stock deduction) |
| GET | `/api/sales` | Yes | Sales history (last 100) |
| GET | `/api/dashboard` | Yes | KPIs, alerts, top sellers, category stats |

---

## ❓ Design Decision Q&A

### Why Vanilla HTML/CSS/JS instead of React?

The frontend is served as a static file directly by Express — there is no separate frontend server, no build step, and no separate deployment. The entire application ships as a single Docker container.

Using React would require either a separate container (Nginx + built React bundle), a build stage in the Dockerfile, or a CDN deployment — all of which add infrastructure complexity for a project where the goal was to demonstrate DevOps depth, not frontend tooling. Vanilla JS with `fetch()` is sufficient for a CRUD dashboard and keeps the architecture simple and explainable end-to-end.

In a team product I would use React + a separate frontend deployment (Vercel or S3+CloudFront), with the API on its own subdomain.

### Why SQLite instead of PostgreSQL or MongoDB?

**SQLite was a deliberate choice, not a limitation.** Reasons:

1. **Zero infrastructure** — no RDS instance to configure, no connection string management, no DB server to keep running. The database is a single file (`inventory.db`) on the EC2 volume.
2. **ACID transactions** — SQLite supports full transactions. The sale creation endpoint uses a transaction to atomically insert the sale AND decrement stock. If the server crashes between those two operations, neither happens — data stays consistent.
3. **Production-ready at this scale** — SQLite handles thousands of reads/writes per second. It powers browsers, mobile apps, and many production web apps. The limitation is concurrent writes from multiple servers — which is not a concern for a single-instance deployment.
4. **Demonstrable trade-off** — I can clearly articulate when I'd switch: if we needed horizontal scaling (multiple app instances), we'd move to PostgreSQL on RDS and update the `better-sqlite3` calls to `pg` client calls. The rest of the code stays identical.

### Why EC2 instead of ECS Fargate or Lambda?

EC2 gives direct SSH access and full OS control, which makes it the best choice for a project that needs to be explained and debugged in real time. ECS Fargate is more production-appropriate but requires ECR image pushes, task definitions, and service configuration — roughly 3x the setup time with no added value for a single-container demo.

The trade-off I'd make in production: ECR + ECS Fargate with an Application Load Balancer, so container restarts and rollbacks are handled by AWS rather than a shell script.

### Why is the database not in GitHub?

`inventory.db` is runtime data, not source code. Committing binary database files to Git causes merge conflicts, bloats repository history, and goes against the principle of separating code from data. The `seed.js` script IS the data migration — it regenerates the database from the `inventory.csv` source file. This is the correct pattern: source data in Git, generated artifacts outside of Git.

### Why JWT instead of sessions?

JWT is stateless — the server doesn't need to store session data anywhere. Each request carries a self-contained, signed token. This matters for scalability: if we add a second EC2 instance behind a load balancer, both instances can verify any token without sharing session state. With sessions, we'd need a shared Redis store or sticky load balancing.

### Why `better-sqlite3` (synchronous) instead of an async SQLite driver?

`better-sqlite3` uses synchronous I/O, which sounds wrong for Node.js — but SQLite reads are so fast (microseconds, in-process, no network) that blocking the event loop is negligible. The synchronous API is significantly simpler to write correct transaction code with, since you don't need to manage async/await inside transactions. For a network-bound database like PostgreSQL, async is critical. For SQLite, sync is fine.

---

## 📁 Project Structure

```
inventory-app/
├── backend/
│   ├── data/
│   │   └── inventory.csv        # 990-row Kaggle grocery dataset (seed source)
│   ├── public/
│   │   └── index.html           # Full single-page frontend (vanilla JS)
│   ├── db.js                    # SQLite connection + table creation
│   ├── server.js                # Express app + all API routes
│   ├── seed.js                  # CSV → SQLite import script
│   ├── Dockerfile               # Node.js 20 Alpine image
│   ├── .dockerignore
│   └── package.json
├── .github/
│   └── workflows/
│       └── deploy.yml           # CI/CD pipeline
├── docker-compose.yml           # Single-service compose config
└── README.md
```

---

## 🔮 What I'd Do Differently in Production

| Current (Demo) | Production Version |
|---|---|
| SQLite file on EC2 disk | PostgreSQL on AWS RDS (Multi-AZ) |
| SSH-based deploy | ECR image push + ECS Fargate rolling deploy |
| HTTP only | HTTPS via ACM + Application Load Balancer |
| JWT secret in docker-compose.yml | AWS Secrets Manager |
| Single EC2 instance | Auto Scaling Group behind ALB |
| No rate limiting | express-rate-limit on /api/auth/login |
| localStorage for JWT | HTTP-only cookies (XSS protection) |
| Manual DB backup | Automated RDS snapshots |

---

## 📊 Dataset

Source: [Grocery Inventory and Sales Dataset](https://www.kaggle.com/datasets/salahuddinahmedshuvo/grocery-inventory-and-sales-dataset) — Kaggle (Public Domain)

The dataset was transformed using `seed.js`:
- Product names mapped to Indian grocery equivalents (Sushi Rice → Basmati Rice 1kg, Feta Cheese → Paneer 200g)
- Prices converted from USD to INR (×83 exchange rate, rounded to realistic Indian price points)
- Warehouse locations replaced with Indian cities (Whitefield Bengaluru, MIDC Andheri Mumbai, Guindy Chennai, etc.)
- Supplier names replaced with Indian FMCG companies (Amul, ITC, Haldiram's, Tata Consumer Products, etc.)
- Categories localized (Dairy → Dairy & Paneer, Fruits & Vegetables → Fruits & Sabzi)

---

## 👨‍💻 Author

**Prasanna Krishna B**  
[GitHub](https://github.com/PrasannaKrishna0307)

---

*Built as a DevOps engineering project demonstrating full-stack development, containerization, cloud deployment, and CI/CD automation.*
