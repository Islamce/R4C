# R4C production deployment on a Hostinger VPS

This runbook deploys the complete R4C stack for browser and mobile UAT. It is written for an owner who is comfortable copying commands but is not expected to be a DevOps specialist.

The package runs:

- PostgreSQL 17
- Redis 8 with authentication and persistence
- private MinIO object storage
- NestJS API
- Next.js 15 standalone web application
- Python BIM worker
- Caddy reverse proxy with HTTPS and wildcard tenant routing

Only ports 80 and 443 are published by Docker. PostgreSQL, Redis, MinIO, the API, the web container, and the BIM worker stay on a private Docker network.

## 1. VPS requirements

R4C cannot run on Hostinger shared hosting. It needs a self-managed VPS because it runs multiple long-lived containers, PostgreSQL, Redis, object storage, and a BIM conversion worker.

Use a plain **Ubuntu 24.04 LTS** VPS.

Minimum for controlled UAT:

- 4 vCPU
- 8 GB RAM
- 80 GB SSD/NVMe storage
- 4 GB swap

Recommended when testing realistic BIM files or several concurrent users:

- 8 vCPU
- 16 GB RAM
- 160 GB or more SSD/NVMe storage
- 4–8 GB swap

Disk consumption is driven mainly by PostgreSQL backups, uploaded source files, generated BIM artifacts, and MinIO backup copies. Keep at least 25% of the disk free.

Official references:

- Docker Engine on Ubuntu: https://docs.docker.com/engine/install/ubuntu/
- Docker Compose plugin: https://docs.docker.com/compose/install/linux/
- Hostinger VPS operating systems: https://support.hostinger.com/en/articles/1583571-what-are-the-available-operating-systems-for-vps

## 2. Domain and DNS preparation

### Production naming example

This guide uses the following example. Replace it with the real domain:

- Main app: `r4c.example.com`
- API: `api.r4c.example.com`
- Tenant suffix: `r4c.example.com`
- Alomran workspace: `alomran.r4c.example.com`

### Why Cloudflare DNS is used

Caddy can issue a wildcard certificate for `*.r4c.example.com`, but Let's Encrypt requires a DNS-01 challenge for wildcard certificates. The deployment image includes the maintained `caddy-dns/cloudflare` module and uses a restricted Cloudflare API token.

The VPS can remain at Hostinger. Only authoritative DNS is managed in Cloudflare. This avoids relying on a young third-party Hostinger Caddy module for certificate automation.

### DNS steps

1. Add the domain to Cloudflare.
2. In Hostinger's domain panel, replace the authoritative nameservers with the nameservers Cloudflare gives you.
3. Wait until Cloudflare shows the zone as active.
4. Create these DNS-only A records, all pointing to the Hostinger VPS public IPv4 address:

| Type | Name | Target |
|---|---|---|
| A | `r4c` | VPS IPv4 |
| A | `api.r4c` | VPS IPv4 |
| A | `*.r4c` | VPS IPv4 |

For a root-domain deployment, use `@`, `api`, and `*` instead.

Keep the records **DNS only** during first deployment. Cloudflare proxying can be evaluated later.

5. Create a Cloudflare API token limited to this zone with:
   - Zone → Zone → Read
   - Zone → DNS → Edit

Do not use the global API key.

A wildcard A record sends undefined tenant subdomains to the VPS, while Caddy's wildcard certificate covers HTTPS for those tenant hosts.

## 3. Initial VPS access and non-root user

Connect using the root credentials supplied by Hostinger:

```bash
ssh root@YOUR_VPS_IP
```

Update the server:

```bash
apt update
apt full-upgrade -y
apt install -y ca-certificates curl git openssl python3 ufw
```

Create a deployment user:

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Open a second terminal and confirm the new account works before continuing:

```bash
ssh deploy@YOUR_VPS_IP
```

Do not close the original root session until the new login is confirmed.

## 4. Firewall

In the Hostinger VPS firewall, allow:

- TCP 22 from your office/home public IP only
- TCP 80 from anywhere
- TCP 443 from anywhere
- UDP 443 from anywhere for HTTP/3

Deny other inbound traffic.

Also configure UFW on Ubuntu. Allow SSH before enabling it:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from YOUR_ADMIN_PUBLIC_IP to any port 22 proto tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 443/udp
sudo ufw enable
sudo ufw status verbose
```

Docker can bypass some UFW rules for explicitly published container ports. This compose file publishes only Caddy's 80/443 ports, so database and storage ports remain unexposed. Do not add PostgreSQL, Redis, MinIO, API, or web port mappings.

Hostinger firewall reference: https://www.hostinger.com/support/4805502-how-to-set-up-a-firewall-at-vps/

## 5. Install Docker Engine and Docker Compose

Run as the `deploy` user:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"${UBUNTU_CODENAME:-$VERSION_CODENAME}\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list >/dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker deploy
```

Log out and reconnect so Docker group membership takes effect:

```bash
exit
ssh deploy@YOUR_VPS_IP
```

Verify:

```bash
docker version
docker compose version
sudo systemctl enable --now docker
```

## 6. Clone R4C

```bash
sudo mkdir -p /opt/r4c
sudo chown deploy:deploy /opt/r4c
git clone https://github.com/Islamce/R4C.git /opt/r4c/app
cd /opt/r4c/app
git checkout main
git pull --ff-only
```

Confirm the repository is clean:

```bash
git status --short
```

It should print nothing.

## 7. Generate and configure production secrets

Make the helper executable and generate the private environment file:

```bash
cd /opt/r4c/app
chmod +x scripts/generate-production-env.sh
./scripts/generate-production-env.sh .env.production.example .env.production
```

The helper:

- refuses to overwrite an existing file;
- generates independent PostgreSQL, Redis, MinIO, JWT, BIM, bootstrap-admin, UAT-admin, and UAT-submitter secrets;
- creates `.env.production` with mode 600;
- never prints the generated secrets.

Edit the file:

```bash
nano .env.production
```

At minimum replace:

- `APP_DOMAIN`
- `API_DOMAIN`
- `TENANT_BASE_DOMAIN`
- `ACME_EMAIL`
- `CLOUDFLARE_API_TOKEN`
- `NEXT_PUBLIC_API_URL`
- `CORS_ORIGINS`
- bootstrap and UAT email addresses

For the naming example:

```dotenv
APP_DOMAIN=r4c.example.com
API_DOMAIN=api.r4c.example.com
TENANT_BASE_DOMAIN=r4c.example.com
NEXT_PUBLIC_API_URL=https://api.r4c.example.com/api/v1
CORS_ORIGINS=https://r4c.example.com,https://alomran.r4c.example.com
```

`API_URL=http://api:4000/api/v1` is intentionally internal. It is used only by the Next.js server container. Browser traffic uses `NEXT_PUBLIC_API_URL` and Caddy's public HTTPS route.

Check that no placeholder remains:

```bash
grep -n 'REPLACE_WITH' .env.production
```

The command must print nothing.

Protect the file:

```bash
chmod 600 .env.production
```

Never commit it:

```bash
git status --short
```

`.env.production` should be ignored and must not appear.

Validate the compose contract without printing resolved secrets:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
```

## 8. Build the production images

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build --pull
```

This builds:

- the non-root NestJS runtime image;
- the API tools image used for migrations and seeds;
- the non-root Next.js standalone runtime image;
- the existing non-root BIM worker image;
- Caddy 2.11.4 with the Cloudflare DNS module.

## 9. First deployment

### Start infrastructure

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d postgres redis minio
```

Wait for health:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

PostgreSQL, Redis, and MinIO should show `healthy`.

### Create the private MinIO bucket

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm minio-init
```

This command is idempotent and keeps the bucket private.

### Run database migrations

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml run --rm api-migrate
```

The command uses `prisma migrate deploy`. Never use `prisma db push` in production.

### Seed the bootstrap tenant

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml --profile tools run --rm api-tools seed
```

### Seed Alomran and both UAT users

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml --profile tools run --rm api-tools seed:uat
```

This creates or updates idempotently:

- tenant `ALOMRAN` / Alomran Development;
- ADMIN and VIEWER roles generated from the existing permission derivation logic;
- the UAT administrator;
- `PROGRESS_SUBMITTER`, based on the current VIEWER role plus `progress:submit`;
- the submit-only UAT user;
- a guard that fails if the submit-only role ever receives `progress:review`.

The passwords are read only from `.env.production` and are never hardcoded.

### Start the default commercial stack

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d
```

The default startup runs the idempotent bucket initializer and `migrate deploy` before the API becomes healthy. It keeps the frozen BIM worker disabled. To start a separately approved BIM runtime, set `BIM_ENABLED=true` with a real private worker URL/token and use the explicit `bim` profile; do not enable it solely to satisfy normal commercial startup.

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml --profile bim up -d bim-worker
```

Watch default startup:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f --tail=100 caddy api web
```

Press `Ctrl+C` to stop following logs; the containers continue running.

Caddy will create the apex/API/wildcard certificates through Cloudflare DNS. Initial issuance can take a few minutes.

## 10. UAT verification

### Command-line health checks

```bash
curl --fail https://api.r4c.example.com/api/v1/health/ready
curl --fail https://r4c.example.com/api/health
```

Expected API readiness includes `"status":"ready"`. The web endpoint includes `"service":"r4c-web"` and `"status":"ok"`.

### Browser checks

1. Open `https://r4c.example.com`.
2. Open `https://alomran.r4c.example.com`.
3. Confirm the login screen identifies **Alomran Development**.
4. Switch to Arabic and confirm **العمران للتطوير العقاري** is shown.
5. Log in using the email in `SEED_UAT_ADMIN_EMAIL` and the generated `SEED_UAT_ADMIN_PASSWORD`.
6. In browser developer tools, open Application/Storage → Cookies and confirm the authentication cookies have:
   - `Secure`
   - `HttpOnly`
   - `SameSite=Lax`
7. Log out and confirm the protected pages redirect to login.
8. Log in with `SEED_UAT_SUBMIT_EMAIL` and `SEED_UAT_SUBMIT_PASSWORD`.
9. Confirm this user can submit progress but cannot approve or reject progress.

Never paste UAT passwords into chat, GitHub issues, or screenshots.

### Container checks

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

The default long-running services should be `Up` and `healthy`:

- postgres
- redis
- minio
- api
- web
- caddy

`bim-worker` is absent unless a separately approved BIM run started it with `--profile bim` and `BIM_ENABLED=true`. `api-migrate` and `minio-init` are expected to show `Exited (0)` after completing.

## 11. Day-2 operations

Use this helper prefix in commands:

```bash
cd /opt/r4c/app
COMPOSE='docker compose --env-file .env.production -f docker-compose.prod.yml'
```

### View logs

```bash
$COMPOSE logs --tail=200 api
$COMPOSE logs --tail=200 web
$COMPOSE logs --tail=200 caddy
$COMPOSE logs -f --tail=100 api web
# Only after a separately approved BIM opt-in:
$COMPOSE --profile bim logs -f --tail=100 bim-worker
```

### Restart a service

```bash
$COMPOSE restart api
$COMPOSE restart web
$COMPOSE restart caddy
```

### Redeploy a new main commit

```bash
cd /opt/r4c/app
git fetch origin
git checkout main
git pull --ff-only origin main
$COMPOSE build --pull
$COMPOSE run --rm api-migrate
$COMPOSE --profile tools run --rm api-tools seed:uat
$COMPOSE up -d --remove-orphans
$COMPOSE ps
```

`seed:uat` is idempotent. It also synchronizes the limited UAT role if permissions evolve.

Do not automatically roll the database back to an older application commit after new migrations have run. Restore a tested backup when a database rollback is genuinely required.

### PostgreSQL backup

```bash
cd /opt/r4c/app
mkdir -p /opt/r4c/backups
chmod 700 /opt/r4c/backups
set -a
source .env.production
set +a
stamp=$(date -u +%Y%m%dT%H%M%SZ)
$COMPOSE exec -T postgres pg_dump \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -Fc > "/opt/r4c/backups/postgres-$stamp.dump"
sha256sum "/opt/r4c/backups/postgres-$stamp.dump" \
  > "/opt/r4c/backups/postgres-$stamp.dump.sha256"
```

Test that the file is non-empty:

```bash
ls -lh /opt/r4c/backups/postgres-*.dump
```

### PostgreSQL restore into an empty database

Perform restores during a maintenance window and test them on a separate server first:

```bash
cat /opt/r4c/backups/postgres-YYYYMMDDTHHMMSSZ.dump | \
  $COMPOSE exec -T postgres pg_restore \
    --clean --if-exists --no-owner \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DB"
```

### MinIO bucket backup

```bash
cd /opt/r4c/app
set -a
source .env.production
set +a
stamp=$(date -u +%Y%m%dT%H%M%SZ)
backup_dir="/opt/r4c/backups/minio-$stamp"
mkdir -p "$backup_dir"

docker run --rm \
  --network r4c_backend \
  -e MINIO_ROOT_USER \
  -e MINIO_ROOT_PASSWORD \
  -e S3_BUCKET \
  -v "$backup_dir:/backup" \
  --entrypoint /bin/sh \
  minio/mc:RELEASE.2025-07-21T05-28-08Z \
  -ec 'mc alias set r4c http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"; mc mirror --overwrite "r4c/$S3_BUCKET" /backup'

tar -C /opt/r4c/backups -czf "/opt/r4c/backups/minio-$stamp.tar.gz" "minio-$stamp"
rm -rf "$backup_dir"
sha256sum "/opt/r4c/backups/minio-$stamp.tar.gz" \
  > "/opt/r4c/backups/minio-$stamp.tar.gz.sha256"
```

### MinIO restore

```bash
restore_dir=/opt/r4c/backups/minio-RESTORE_DIRECTORY

docker run --rm \
  --network r4c_backend \
  -e MINIO_ROOT_USER \
  -e MINIO_ROOT_PASSWORD \
  -e S3_BUCKET \
  -v "$restore_dir:/restore:ro" \
  --entrypoint /bin/sh \
  minio/mc:RELEASE.2025-07-21T05-28-08Z \
  -ec 'mc alias set r4c http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"; mc mirror --overwrite /restore "r4c/$S3_BUCKET"'
```

Copy backups off the VPS after every backup. Hostinger VPS snapshots are useful, but they are not a replacement for independently stored PostgreSQL and MinIO backups.

### Disk and resource checks

```bash
df -h
docker system df
docker stats --no-stream
$COMPOSE ps
```

Do not run `docker system prune --volumes`; it can delete production data volumes.

## 12. Emergency stop and startup

Stop application traffic while preserving data:

```bash
$COMPOSE stop caddy web api
# If it was separately enabled:
$COMPOSE --profile bim stop bim-worker
```

Start it again:

```bash
$COMPOSE up -d
```

Stop all containers without deleting volumes:

```bash
$COMPOSE down
```

Never add `--volumes` to a production `down` command.

## 13. Security checklist before UAT

- [ ] Hostinger shared hosting is not being used.
- [ ] Ubuntu and Docker packages are current.
- [ ] SSH uses keys and port 22 is limited to the administrator IP.
- [ ] Only 80/443 TCP and 443 UDP are public.
- [ ] Cloudflare token is zone-scoped, not a global key.
- [ ] `.env.production` is mode 600 and uncommitted.
- [ ] No placeholder or development password remains.
- [ ] PostgreSQL, Redis, MinIO, API, web, and BIM ports are not mapped to the host.
- [ ] HTTPS works for the main, API, and Alomran domains.
- [ ] Authentication cookies are Secure and HttpOnly.
- [ ] UAT administrator login works.
- [ ] Submit-only UAT login works and cannot review progress.
- [ ] PostgreSQL and MinIO backup commands have been tested.

## 14. Not automated in Phase 7

The package provides reproducible deployment and manual operations. The following are intentionally left as later hardening work:

- scheduled encrypted offsite backups and retention;
- uptime, certificate, container, disk, and database monitoring;
- centralized log collection;
- GitHub Actions deployment to the VPS;
- automated restore drills;
- blue/green or rolling deployment;
- Cloudflare proxy/WAF tuning after direct-origin UAT is stable.
