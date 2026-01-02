# Deployment Guide - Esensi Dashboard on Hostinger KVM 2

This guide provides step-by-step instructions for deploying the Esensi Lead Dashboard on your Hostinger KVM 2 VPS with Docker and Traefik.

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Hostinger KVM 2 VPS access (SSH)
- [ ] Docker and docker-compose installed on VPS
- [ ] PostgreSQL database running on VPS host (not in Docker)
- [ ] Traefik reverse proxy configured (or ready to configure)
- [ ] Git installed on VPS
- [ ] Domain name (optional - can use IP:port for testing)

## 🗄️ Step 1: Database Preparation

### 1.1 Create Read-Only Database User

**⚠️ ACTION REQUIRED**: SSH into your VPS and connect to PostgreSQL:

```bash
ssh user@<YOUR_VPS_IP>
sudo -u postgres psql
```

**Create the read-only user**:

```sql
-- Create user
CREATE USER dashboard_reader WITH PASSWORD 'CHOOSE_A_STRONG_PASSWORD';

-- Grant connection
GRANT CONNECT ON DATABASE esensi_db TO dashboard_reader;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO dashboard_reader;

-- Grant SELECT on all existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dashboard_reader;

-- Grant SELECT on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
  GRANT SELECT ON TABLES TO dashboard_reader;

-- Verify permissions
\du dashboard_reader
\q
```

### 1.2 Test Database Connection

```bash
psql -h localhost -U dashboard_reader -d esensi_db -c "SELECT COUNT(*) FROM leads;"
```

If this works, your database is ready!

## 🌐 Step 2: Network Setup

### 2.1 Create Traefik Network

**⚠️ ACTION REQUIRED**: Create the external Docker network for Traefik:

```bash
docker network create traefik_proxy
```

**Note**: If you already have this network, you'll get an error - that's fine!

### 2.2 Verify Traefik is Running

```bash
docker ps | grep traefik
```

You should see a running Traefik container.

## 📦 Step 3: Deploy the Dashboard

### 3.1 Clone the Repository

**⚠️ ACTION REQUIRED**: Clone to your VPS:

```bash
cd ~
git clone <YOUR_REPOSITORY_URL> esensi-dashboard
cd esensi-dashboard
```

### 3.2 Create Production Environment File

**⚠️ ACTION REQUIRED**: Create `.env` file:

```bash
cp .env.example .env
nano .env
```

**Configure the following values** (press Ctrl+X, then Y, then Enter to save):

```env
# PostgreSQL Database (host machine)
DB_HOST=host.docker.internal
DB_PORT=5432
DB_NAME=esensi_db
DB_USER=dashboard_reader
DB_PASSWORD=<THE_PASSWORD_YOU_CREATED_IN_STEP_1>

# Authentication
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=<CHOOSE_A_STRONG_PASSWORD>

# Session Secret (generate a random string)
SESSION_SECRET=<GENERATE_RANDOM_STRING_HERE>

# Application
PORT=3000
NODE_ENV=production
```

**💡 Tip**: Generate a random session secret:
```bash
openssl rand -base64 32
```

### 3.3 Update docker-compose with Your Domain

**⚠️ ACTION REQUIRED**: Edit the docker-compose file:

```bash
nano docker-compose.dashboard.yml
```

**Find this line**:
```yaml
- "traefik.http.routers.esensi-dashboard.rule=Host(`TBD_DOMAIN`)"
```

**Replace `TBD_DOMAIN` with**:
- Your actual domain: `dashboard.yourdomain.com`
- OR comment it out if you're using IP:port for now

**If using IP:port initially**, make sure these lines are uncommented:
```yaml
ports:
  - "8085:3000"
```

### 3.4 Build the Docker Image

**⚠️ ACTION REQUIRED**: Build the dashboard image:

```bash
docker build -t esensi-dashboard:latest .
```

**This will take a few minutes**. You should see:
```
[+] Building XX.Xs (14/14) FINISHED
```

### 3.5 Deploy the Container

**⚠️ ACTION REQUIRED**: Start the dashboard:

```bash
docker-compose -f docker-compose.dashboard.yml up -d
```

**Expected output**:
```
Creating esensi-dashboard ... done
```

### 3.6 Verify Deployment

**Check container status**:
```bash
docker ps | grep esensi-dashboard
```

**Check logs**:
```bash
docker logs esensi-dashboard
```

**You should see**:
```
🚀 Esensi Dashboard server running on port 3000
📊 Environment: production
```

## ✅ Step 4: Test the Dashboard

### 4.1 Test Database Connection

**⚠️ ACTION REQUIRED**: Test DB connectivity from container:

```bash
docker exec -it esensi-dashboard sh
```

**Inside container, run**:
```bash
node -e "const {Pool}=require('pg'); const p=new Pool({host:process.env.DB_HOST, port:process.env.DB_PORT, user:process.env.DB_USER, password:process.env.DB_PASSWORD, database:process.env.DB_NAME}); p.query('SELECT COUNT(*) as total FROM leads').then(r=>{console.log('✓ DB Connected - Total leads:',r.rows[0].total);process.exit(0)}).catch(e=>{console.error('✗ DB Error:',e.message);process.exit(1)});"
```

**Expected**: `✓ DB Connected - Total leads: XXX`

Type `exit` to leave the container.

### 4.2 Access the Dashboard

**Option A: Via Domain** (if configured):
```
https://dashboard.yourdomain.com
```

**Option B: Via IP:Port** (if using port mapping):
```
http://<YOUR_VPS_IP>:8085
```

### 4.3 Login and Verify

1. Navigate to the dashboard URL
2. Login with the credentials from your `.env` file
3. Verify KPI cards show real data
4. Check chart displays leads over time
5. Verify table shows recent leads
6. Test pagination
7. Try copying a WhatsApp number
8. Test logout

## 🔧 Step 5: Configure Domain and HTTPS (Optional)

### 5.1 DNS Configuration

**⚠️ ACTION REQUIRED**: Point your domain to VPS:

1. Go to your domain registrar/DNS provider
2. Add an A record:
   - **Host**: `dashboard` (or `@` for root domain)
   - **Type**: A
   - **Value**: `<YOUR_VPS_IP>`
   - **TTL**: 3600 (or automatic)

3. Wait for DNS propagation (5-30 minutes)

### 5.2 Test DNS Resolution

```bash
nslookup dashboard.yourdomain.com
```

Should return your VPS IP.

### 5.3 Update Traefik Labels

**If not done in Step 3.3**, uncomment and update the domain in `docker-compose.dashboard.yml`:

```yaml
- "traefik.http.routers.esensi-dashboard.rule=Host(`dashboard.yourdomain.com`)"
```

**Redeploy**:
```bash
docker-compose -f docker-compose.dashboard.yml down
docker-compose -f docker-compose.dashboard.yml up -d
```

### 5.4 Verify HTTPS

Visit `https://dashboard.yourdomain.com`

Traefik should automatically:
- Issue a Let's Encrypt SSL certificate
- Redirect HTTP to HTTPS

## 🔄 Updates and Maintenance

### Updating the Application

**⚠️ ACTION REQUIRED**: When you have updates:

```bash
cd ~/esensi-dashboard
git pull origin master
docker build -t esensi-dashboard:latest .
docker-compose -f docker-compose.dashboard.yml down
docker-compose -f docker-compose.dashboard.yml up -d
```

### Viewing Logs

```bash
docker logs esensi-dashboard
docker logs -f esensi-dashboard  # Follow live
```

### Restarting the Container

```bash
docker-compose -f docker-compose.dashboard.yml restart
```

### Stopping the Container

```bash
docker-compose -f docker-compose.dashboard.yml down
```

## 🚨 Troubleshooting

### Dashboard won't start

**Check logs**:
```bash
docker logs esensi-dashboard
```

**Common issues**:
- Database connection failed → Check DB_HOST, credentials
- Port already in use → Change port in docker-compose
- Traefik network error → Create network: `docker network create traefik_proxy`

### Can't connect to database

**Test from host**:
```bash
psql -h localhost -U dashboard_reader -d esensi_db -c "SELECT 1;"
```

**Test from container**:
```bash
docker exec -it esensi-dashboard sh
# Then test connection (see Step 4.1)
```

**Check**:
- Is PostgreSQL running? `systemctl status postgresql`
- Is `host.docker.internal` working? Check `extra_hosts` in docker-compose
- Are credentials correct in `.env`?

### Dashboard accessible but shows no data

**Check API endpoints**:
```bash
curl -X POST http://localhost:8085/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YOUR_PASSWORD"}'
```

**Verify database has data**:
```bash
psql -U dashboard_reader -d esensi_db -c "SELECT COUNT(*) FROM leads;"
```

### SSL/HTTPS not working

**Check Traefik logs**:
```bash
docker logs <traefik-container-name>
```

**Verify**:
- DNS points to correct IP
- Traefik labels are correct in docker-compose
- Port 80 and 443 are open on VPS firewall

## 📊 Monitoring

### Check Container Health

```bash
docker ps
docker stats esensi-dashboard
```

### Check Resource Usage

```bash
docker exec esensi-dashboard sh -c "ps aux"
```

### Database Performance

```sql
-- Connect to database
psql -U postgres -d esensi_db

-- Check slow queries
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

## 🔐 Security Checklist

- [ ] Read-only database user configured
- [ ] Strong passwords for DASHBOARD_USERNAME and DASHBOARD_PASSWORD
- [ ] SESSION_SECRET is random and secure
- [ ] `.env` file permissions are restricted: `chmod 600 .env`
- [ ] HTTPS enabled via Traefik
- [ ] VPS firewall configured (only ports 80, 443, 22 open)
- [ ] Regular security updates: `apt update && apt upgrade`
- [ ] Database backups configured

## 📞 Need Help?

If you encounter issues:

1. Check logs: `docker logs esensi-dashboard`
2. Verify database connectivity
3. Review this guide step-by-step
4. Contact the development team

---

**Deployment Checklist Summary**:

- [ ] Database user created and tested
- [ ] Traefik network exists
- [ ] Repository cloned to VPS
- [ ] `.env` file configured with correct values
- [ ] Docker image built successfully
- [ ] Container running
- [ ] Database connection verified
- [ ] Dashboard accessible via browser
- [ ] Login works with real data
- [ ] Domain configured (if applicable)
- [ ] HTTPS working (if using domain)

**Congratulations! Your Esensi Dashboard is deployed! 🎉**
