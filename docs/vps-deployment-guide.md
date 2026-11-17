# Med24Plus — Production VPS Deployment Guide

This guide walks you through deploying **Med24Plus** (FastAPI Backend, Next.js Admin Panel, and Next.js Customer Web) onto a live Linux VPS (Ubuntu 22.04 / 24.04 LTS) under your custom subdomains:

- **Customer Website**: `https://med24plus.serwex.in`
- **Admin Panel**: `https://med24plus-admin.serwex.in`
- **FastAPI API**: `https://med24plus-api.serwex.in`

---

## Architecture Overview

```
                      INTERNET / USERS
                             │
                  HTTPS (Port 443 / SSL)
                             │
                             ▼
             ┌───────────────────────────────┐
             │    Host Nginx Reverse Proxy   │
             │   (Let's Encrypt Certbot SSL) │
             └───────┬───────┬───────┬───────┘
                     │       │       │
       ┌─────────────┘       │       └─────────────┐
       ▼                     ▼                     ▼
Port 3000 (Localhost)  Port 3001 (Localhost)  Port 8000 (Localhost)
med24plus.serwex.in    med24plus-admin.serwex  med24plus-api.serwex.in
       │                     │                     │
       ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Next.js 14  │      │  Next.js 14  │      │   FastAPI    │
│ Customer Web │      │  Admin Panel │      │   Backend    │
└──────────────┘      └──────────────┘      └──────┬───────┘
                                                   │
                                      ┌────────────┴────────────┐
                                      ▼                         ▼
                              ┌──────────────┐          ┌──────────────┐
                              │ PostgreSQL 16│          │   Redis 7    │
                              │   Database   │          │  Cache/Rate  │
                              └──────────────┘          └──────────────┘
```

---

## Step 1: Configure DNS Records

Log in to your DNS provider (Cloudflare, GoDaddy, Namecheap, etc.) for `serwex.in` and add **3 A Records** pointing to your VPS public IPv4 address:

| Type | Name / Subdomain | Target / Value | TTL | Proxy Status (if Cloudflare) |
|---|---|---|---|---|
| **A** | `med24plus` | `YOUR_VPS_IP` | Auto / 300s | DNS Only (Gray Cloud) during Certbot |
| **A** | `med24plus-admin` | `YOUR_VPS_IP` | Auto / 300s | DNS Only (Gray Cloud) during Certbot |
| **A** | `med24plus-api` | `YOUR_VPS_IP` | Auto / 300s | DNS Only (Gray Cloud) during Certbot |

> **Verification**: Check propagation on your local machine:
> ```bash
> dig +short med24plus.serwex.in
> dig +short med24plus-admin.serwex.in
> dig +short med24plus-api.serwex.in
> ```
> All three must resolve to your VPS IP address before generating SSL certificates.

---

## Step 2: VPS Server Initialization (Ubuntu 22.04 / 24.04)

SSH into your VPS as `root`:
```bash
ssh root@YOUR_VPS_IP
```

### 2.1 Update System & Install Core Utilities
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw htop fail2ban nginx certbot python3-certbot-nginx
```

### 2.2 Configure Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status
```

### 2.3 Install Docker & Docker Compose
```bash
# Add Docker's official GPG key & repository
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Verify installation
docker --version
docker compose version
```

---

## Step 3: Clone Project & Prepare Directories

Create a deployment directory under `/var/www`:
```bash
sudo mkdir -p /var/www/med24plus
cd /var/www/med24plus

# Clone your repository (use your Git repository URL)
git clone <YOUR_GIT_REPO_URL> .
```

---

## Step 4: Configure Production Environment Variables

Generate strong cryptographic keys:
```bash
# Generate 3 distinct secure secrets
openssl rand -hex 32   # Use for POSTGRES_PASSWORD
openssl rand -hex 32   # Use for REDIS_PASSWORD
openssl rand -hex 32   # Use for JWT_SECRET_KEY
openssl rand -hex 32   # Use for PRESCRIPTION_HMAC_SECRET
```

Create `.env.production` in `/var/www/med24plus`:
```bash
cp infrastructure/deployment/.env.production.example .env.production
nano .env.production
```

Ensure the variables are populated:
```env
POSTGRES_USER=med24plus_user
POSTGRES_PASSWORD=<YOUR_GENERATED_POSTGRES_PASSWORD>
POSTGRES_DB=med24plus_db
POSTGRES_PORT=5432
POSTGRES_SERVER=postgres
DATABASE_URL=postgresql+asyncpg://med24plus_user:<YOUR_GENERATED_POSTGRES_PASSWORD>@postgres:5432/med24plus_db

REDIS_PORT=6379
REDIS_PASSWORD=<YOUR_GENERATED_REDIS_PASSWORD>
REDIS_URL=redis://:<YOUR_GENERATED_REDIS_PASSWORD>@redis:6379/0

ENVIRONMENT=production
DEBUG=False
PROJECT_NAME=Med24Plus
API_V1_STR=/api/v1

JWT_SECRET_KEY=<YOUR_GENERATED_JWT_KEY>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

PRESCRIPTION_HMAC_SECRET=<YOUR_GENERATED_HMAC_KEY>

CORS_ORIGINS=["https://med24plus.serwex.in","https://med24plus-admin.serwex.in"]
NEXT_PUBLIC_API_URL=https://med24plus-api.serwex.in/api/v1
```

Save and lock permissions:
```bash
chmod 600 .env.production
```

---

## Step 5: Build & Launch Docker Containers

Run the production Docker Compose stack:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Verify all 5 containers are running:
```bash
docker compose -f docker-compose.prod.yml ps
```
You should see:
- `med24plus_prod_postgres` (Up, healthy)
- `med24plus_prod_redis` (Up, healthy)
- `med24plus_prod_backend` (Up, listening on `127.0.0.1:8024`)
- `med24plus_prod_web` (Up, listening on `127.0.0.1:3024`)
- `med24plus_prod_admin` (Up, listening on `127.0.0.1:3025`)

---

## Step 6: Run Database Migrations & Seed Data

Execute Alembic migrations inside the running backend container:
```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend alembic upgrade head
```

Verify backend health check locally:
```bash
curl http://127.0.0.1:8024/api/v1/health
# Response: {"status":"healthy","database":"connected","redis":"connected"}
```

### Provision Super Administrator
Run the admin creation utility:
```bash
docker compose -f docker-compose.prod.yml exec backend python -m app.utils.create_admin \
  --phone 9999999999 \
  --password "YourSecureSuperAdminPassword123!" \
  --name "Super Administrator" \
  --email "admin@serwex.in"
```

---

## Step 7: Configure Host Nginx & Let's Encrypt SSL

### 7.1 Install Nginx Configuration
Copy the provided Nginx configuration file:
```bash
sudo cp infrastructure/nginx/production.conf /etc/nginx/sites-available/med24plus.conf
sudo ln -s /etc/nginx/sites-available/med24plus.conf /etc/nginx/sites-enabled/

# Remove default site if present
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 7.2 Obtain Free SSL Certificates (Certbot)
Run Certbot to obtain and configure SSL for all 3 subdomains simultaneously:
```bash
sudo certbot --nginx \
  -d med24plus.serwex.in \
  -d med24plus-admin.serwex.in \
  -d med24plus-api.serwex.in \
  --non-interactive \
  --agree-tos \
  -m admin@serwex.in \
  --redirect
```

Certbot will automatically:
1. Validate ownership of all 3 subdomains via HTTP-01 challenge.
2. Issue trusted Let's Encrypt certificates.
3. Configure HTTPS redirects (HTTP $\rightarrow$ HTTPS) in Nginx.
4. Set up an automated systemd renewal timer.

Test automatic renewal:
```bash
sudo certbot renew --dry-run
```

---

## Step 8: Verify Live Services

Open your browser and test each live endpoint:

1. **Customer Web**: [https://med24plus.serwex.in](https://med24plus.serwex.in)
   - Browse catalog, register customer, add items to cart, test checkout preparation.
2. **Admin Panel**: [https://med24plus-admin.serwex.in](https://med24plus-admin.serwex.in)
   - Sign in with the super administrator credentials provisioned in Step 6.
   - Configure Delivery Matrix & Serviceable Pincodes under `/settings/delivery`.
3. **API OpenAPI Docs**: [https://med24plus-api.serwex.in/docs](https://med24plus-api.serwex.in/docs)
   - Interactive Swagger API documentation.

---

## Step 9: Maintenance & Updates

### Automated Deployments (Future Code Updates)
Whenever you push changes to GitHub, deploy the updates on the VPS using the zero-downtime deployment script:
```bash
cd /var/www/med24plus
./infrastructure/scripts/deploy-prod.sh
```

### Automated Nightly Database Backups
Set up a daily PostgreSQL backup cron job:
```bash
sudo crontab -e
```
Add the following line (runs every midnight at 02:00 AM):
```cron
0 2 * * * docker compose -f /var/www/med24plus/docker-compose.prod.yml exec -T postgres pg_dump -U med24plus_user med24plus_db | gzip > /var/backups/med24plus_db_$(date +\%F).sql.gz
```

---

## Step 10: Troubleshooting

### 10.1 Port Already in Use (Conflict with Another Project)
If your VPS is already running other applications on ports `3000`, `3001`, or `8000`, Med24Plus supports custom ports via `.env.production`:
1. In `/var/www/med24plus/.env.production`, set your desired available host ports:
   ```bash
   BACKEND_PORT=8024
   WEB_PORT=3024
   ADMIN_PORT=3025
   ```
2. Verify Nginx points to these ports in `/etc/nginx/sites-available/med24plus.conf`:
   - `med24plus-api.serwex.in` -> `http://127.0.0.1:8024`
   - `med24plus.serwex.in`     -> `http://127.0.0.1:3024`
   - `med24plus-admin.serwex.in` -> `http://127.0.0.1:3025`
3. Reload Nginx and relaunch containers:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   docker compose -f docker-compose.prod.yml up -d --build
   ```

### 10.2 Next.js Build Failure (`npm run build did not complete successfully: exit code 1`)
If `docker compose ... build` fails at `RUN npm run build`:
1. **Pull Latest Code**: Ensure you have pulled the latest changes where the `DataTable` `isLoading` prop was fixed:
   ```bash
   git pull origin main
   ```
2. **VPS Out-Of-Memory (OOM)**: Compiling Next.js pages requires ~1.5GB of RAM. If your VPS has 1GB-2GB of RAM and another project is running, Docker will kill the Node process. Enable a 2GB swap file:
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```
3. **Build with Clean Cache**:
   ```bash
   docker compose -f docker-compose.prod.yml build --no-cache admin-panel
   docker compose -f docker-compose.prod.yml up -d
   ```
